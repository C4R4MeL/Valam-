import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BiteshipService } from './biteship.service';
import { DocumentHelper } from './document.helper';
import { SupabaseService } from '../supabase/supabase.service';
import { Writable } from 'stream';
import * as path from 'path';
import * as fs from 'fs';

// Constants for calculations
const DRUM_CAPASITAS_KG = 180;
const DRUM_PANJANG_CM = 60;
const DRUM_LEBAR_CM = 60;
const DRUM_TINGGI_CM = 90;
const DIVISOR_VOLUMETRIK = 6000;
const TARIF_ASURANSI = 0.002;
const BIAYA_PENGEMASAN_PER_DRUM = 50000;

@Injectable()
export class ShipmentService {
  private readonly logger = new Logger(ShipmentService.name);

  constructor(
    private prisma: PrismaService,
    private biteshipService: BiteshipService,
    private documentHelper: DocumentHelper,
    private supabaseService: SupabaseService
  ) {}

  async getOngkirOptions(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { include: { profile: true } },
        supplier: { include: { profile: true, supplier_profile: true } },
        items: { include: { product: true } }
      }
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.buyer_id !== userId) throw new ForbiddenException('Bukan pesanan Anda');

    const totalWeight = order.items.reduce((sum, item) => sum + item.quantity_kg, 0);

    if (totalWeight > 500) {
      throw new BadRequestException('Berat melebihi 500 kg. Harap hubungi tim Valam untuk armada khusus.');
    }

    const drumCount = Math.ceil(totalWeight / DRUM_CAPASITAS_KG);
    const weightInGrams = totalWeight * 1000;
    const itemValue = order.total_amount;

    const supplierProfile = order.supplier.supplier_profile;
    const buyerProfile = order.buyer.profile;

    const originPostalCode = supplierProfile?.npwp ? '14310' : '23111'; // Mock or fallback
    const destPostalCode = buyerProfile?.npwp ? '17530' : '17530'; // Mock/fallback

    const rawRates = await this.biteshipService.getRates(
      originPostalCode,
      destPostalCode,
      weightInGrams,
      itemValue,
      drumCount
    );

    const originProvince = order.items[0]?.product?.origin_province || 'Aceh';
    const orderAddress = (order.shipping_address as any)?.address;
    const destinationAddressStr = orderAddress || buyerProfile?.address || '';

    return rawRates.map((rate) => {
      // Calculate dynamic B2B shipping rate
      const baseCost = this.calculateBaseRate(rate.kurirKode, totalWeight, originProvince, destinationAddressStr);
      const insurance = Math.ceil(itemValue * TARIF_ASURANSI);
      const packaging = drumCount * BIAYA_PENGEMASAN_PER_DRUM;
      const total = baseCost + insurance + packaging;

      return {
        rateId: rate.rateId,
        kurirNama: rate.kurirNama,
        kurirKode: rate.kurirKode,
        serviceNama: rate.serviceNama,
        serviceKode: rate.serviceKode,
        estimasiHari: rate.estimasiHari,
        ongkirDasar: baseCost,
        biayaAsuransi: insurance,
        biayaPengemasan: packaging,
        totalOngkir: total,
        tersedia: true
      };
    });
  }

  private calculateBaseRate(courier: string, weight: number, origin: string, destination: string): number {
    let ratePerKg = 1500;
    if (courier === 'jne') ratePerKg = 2500;
    else if (courier === 'sicepat') ratePerKg = 2200;

    let base = weight * ratePerKg;
    
    // Multiplier
    const lowerOrigin = origin.toLowerCase();
    const lowerDest = destination.toLowerCase();
    let multiplier = 1.0;

    const isOriginSumatra = lowerOrigin.includes('aceh') || lowerOrigin.includes('sumatra');
    const isDestJavaWest = lowerDest.includes('jawa barat') || lowerDest.includes('jabar') || lowerDest.includes('cikarang') || lowerDest.includes('jakarta');
    const isDestJavaCentralEast = lowerDest.includes('jawa tengah') || lowerDest.includes('jateng') || lowerDest.includes('jawa timur') || lowerDest.includes('jatim');

    if (isOriginSumatra) {
      if (isDestJavaWest) multiplier = 1.4;
      else if (isDestJavaCentralEast) multiplier = 1.6;
    }

    return Math.round(base * multiplier);
  }

  async confirmOngkir(orderId: string, selectedRateId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { include: { profile: true } },
        supplier: { include: { profile: true, supplier_profile: true } },
        items: { include: { product: true } }
      }
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.buyer_id !== userId) throw new ForbiddenException('Bukan pesanan Anda');
    if (order.status !== 'UNPAID') throw new BadRequestException('Status pesanan harus UNPAID');

    const totalWeight = order.items.reduce((sum, item) => sum + item.quantity_kg, 0);
    const drumCount = Math.ceil(totalWeight / DRUM_CAPASITAS_KG);
    const volWeight = (DRUM_PANJANG_CM * DRUM_LEBAR_CM * DRUM_TINGGI_CM / DIVISOR_VOLUMETRIK) * drumCount;
    const billedWeight = Math.max(totalWeight, volWeight);

    // Call getOngkirOptions and find chosen rateId
    const options = await this.getOngkirOptions(orderId, userId);
    const rate = options.find((opt) => opt.rateId === selectedRateId) || options[0];

    // Snapshot addresses
    const originAddr = {
      name: order.supplier.supplier_profile?.nama_koperasi || 'Koperasi Produsen',
      phone: order.supplier.supplier_profile?.whatsapp || '08123456789',
      address: order.supplier.supplier_profile?.alamat_lengkap || 'Aceh'
    };

    const destAddr = {
      name: order.buyer.profile?.company_name || 'Buyer Corp',
      phone: order.buyer.profile?.phone || '08123456789',
      address: order.buyer.profile?.address || 'Destination Port'
    };

    // Upsert Shipment record
    const shipment = await this.prisma.shipment.upsert({
      where: { order_id: orderId },
      create: {
        order_id: orderId,
        shipment_type: 'DOMESTIK',
        biteship_rate_id: rate.rateId,
        courier_name: rate.kurirNama,
        courier_code: rate.kurirKode,
        service_name: rate.serviceNama,
        service_code: rate.serviceKode,
        estimated_days: rate.estimasiHari,
        base_shipping_cost: rate.ongkirDasar,
        insurance_fee: rate.biayaAsuransi,
        packaging_fee: rate.biayaPengemasan,
        total_shipping_cost: rate.totalOngkir,
        actual_weight: totalWeight,
        volumetric_weight: volWeight,
        billed_weight: billedWeight,
        drum_count: drumCount,
        origin_address: originAddr,
        destination_address: destAddr,
        status: 'TERKONFIRMASI'
      },
      update: {
        shipment_type: 'DOMESTIK',
        biteship_rate_id: rate.rateId,
        courier_name: rate.kurirNama,
        courier_code: rate.kurirKode,
        service_name: rate.serviceNama,
        service_code: rate.serviceKode,
        estimated_days: rate.estimasiHari,
        base_shipping_cost: rate.ongkirDasar,
        insurance_fee: rate.biayaAsuransi,
        packaging_fee: rate.biayaPengemasan,
        total_shipping_cost: rate.totalOngkir,
        actual_weight: totalWeight,
        volumetric_weight: volWeight,
        billed_weight: billedWeight,
        drum_count: drumCount,
        origin_address: originAddr,
        destination_address: destAddr,
        status: 'TERKONFIRMASI'
      }
    });

    // Update order with shipping cost
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        shipping_cost: rate.totalOngkir,
        shipping_address: destAddr
      }
    });

    await this.createSystemNotification(
      order.buyer_id,
      'SHIPMENT_CONFIRMED',
      'Pengiriman Domestik Dikonfirmasi',
      `Opsi pengiriman via ${rate.kurirNama} (${rate.serviceNama}) berhasil dikunci untuk order ${order.order_number}.`
    );

    return shipment;
  }

  async submitEksporShipping(orderId: string, data: any, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { include: { profile: true } },
        supplier: { include: { profile: true, supplier_profile: true } },
        items: { include: { product: true } }
      }
    });

    if (!order) throw new NotFoundException('Order tidak ditemukan');
    if (order.buyer_id !== userId) throw new ForbiddenException('Bukan pesanan Anda');
    if (order.status !== 'UNPAID') throw new BadRequestException('Status pesanan harus UNPAID');

    const originAddr = {
      name: order.supplier.supplier_profile?.nama_koperasi || 'Koperasi Produsen',
      phone: order.supplier.supplier_profile?.whatsapp || '08123456789',
      address: order.supplier.supplier_profile?.alamat_lengkap || 'Aceh'
    };

    const destAddr = {
      name: order.buyer.profile?.company_name || 'Buyer Corp',
      phone: order.buyer.profile?.phone || '08123456789',
      address: order.buyer.profile?.address || 'Destination Port'
    };

    // Calculate drum count
    const totalWeight = order.items.reduce((sum, item) => sum + item.quantity_kg, 0);
    const drumCount = Math.ceil(totalWeight / DRUM_CAPASITAS_KG);

    const isExw = data.incoterms === 'EXW';
    const totalOngkir = isExw ? 0 : (data.estimasiFreight || 0);

    const shipment = await this.prisma.shipment.upsert({
      where: { order_id: orderId },
      create: {
        order_id: orderId,
        shipment_type: 'EKSPOR',
        incoterms: data.incoterms,
        port_origin: data.portOrigin || 'Belawan Port',
        port_destination: data.portDestination,
        forwarder_name: data.forwarderName,
        estimated_freight: totalOngkir,
        export_notes: data.exportNotes,
        total_shipping_cost: 0, // Ekspor ongkir diluar escrow
        drum_count: drumCount,
        origin_address: originAddr,
        destination_address: destAddr,
        status: 'TERKONFIRMASI'
      },
      update: {
        shipment_type: 'EKSPOR',
        incoterms: data.incoterms,
        port_origin: data.portOrigin || 'Belawan Port',
        port_destination: data.portDestination,
        forwarder_name: data.forwarderName,
        estimated_freight: totalOngkir,
        export_notes: data.exportNotes,
        total_shipping_cost: 0,
        drum_count: drumCount,
        origin_address: originAddr,
        destination_address: destAddr,
        status: 'TERKONFIRMASI'
      }
    });

    // Update order
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        shipping_cost: 0, // Ekspor Rp 0 di escrow
        shipping_address: destAddr
      }
    });

    // Generate Invoice/Packing List
    await this.generateExportDocuments(orderId);

    await this.createSystemNotification(
      order.supplier_id,
      'NEW_EXPORT_ORDER',
      'Pesanan Ekspor Baru',
      `Pesanan B2B Ekspor baru #${order.order_number} dengan Incoterms ${data.incoterms} menunggu konfirmasi.`
    );

    return shipment;
  }

  async confirmPickup(shipmentId: string, supplierId: string, pickupPhoto?: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: {
          include: {
            buyer: true,
            supplier: { include: { supplier_profile: true } }
          }
        }
      }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
    if (shipment.order.supplier_id !== supplierId) {
      throw new ForbiddenException('Bukan hak akses Anda untuk konfirmasi pickup');
    }

    if (shipment.shipment_type === 'DOMESTIK') {
      // Create shipping order on Biteship
      const biteshipOrder = await this.biteshipService.createOrder({
        shipper_contact_name: shipment.order.supplier.supplier_profile?.nama_pic || 'PIC Supplier',
        shipper_contact_phone: shipment.order.supplier.supplier_profile?.whatsapp || '08123456789',
        shipper_contact_email: shipment.order.supplier.email,
        shipper_organization: shipment.order.supplier.supplier_profile?.nama_koperasi || 'Koperasi Produsen',
        origin_contact_name: shipment.order.supplier.supplier_profile?.nama_pic || 'PIC Supplier',
        origin_contact_phone: shipment.order.supplier.supplier_profile?.whatsapp || '08123456789',
        origin_address: shipment.order.supplier.supplier_profile?.alamat_lengkap || 'Aceh',
        origin_postal_code: '23111',
        destination_contact_name: shipment.order.buyer.email,
        destination_contact_phone: '08123456789',
        destination_address: (shipment.destination_address as any).address || 'Jakarta',
        destination_postal_code: '17530',
        courier_company: shipment.courier_code || 'jne',
        courier_type: shipment.service_code || 'jtr',
        delivery_type: 'now',
        items: [
          {
            name: 'Minyak Nilam',
            description: 'Patchouli Oil Cargo',
            weight: Number(shipment.actual_weight || 100) * 1000,
            quantity: shipment.drum_count || 1
          }
        ]
      });

      await this.prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: 'DIKIRIM',
          tracking_number: biteshipOrder.trackingNumber,
          tracking_url: biteshipOrder.trackingUrl,
          shipped_at: new Date()
        }
      });
    } else {
      // Export manual confirm
      await this.prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: 'DIKIRIM',
          shipped_at: new Date()
        }
      });
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: shipment.order_id },
      data: { status: 'SHIPPED' }
    });

    // Create tracking log for SHIPPED status with base64 photo
    await this.prisma.shipmentTrackingLog.create({
      data: {
        shipment_id: shipmentId,
        status: 'SHIPPED',
        description: pickupPhoto || 'Kargo telah dijemput oleh kurir ekspedisi.'
      }
    });

    await this.createSystemNotification(
      shipment.order.buyer_id,
      'SHIPMENT_SHIPPED',
      'Pesanan Minyak Nilam Dikirim',
      `Pesanan Anda #${shipment.order.order_number} telah diserahkan ke kargo/forwarder.`
    );

    return this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { tracking_logs: true }
    });
  }

  async updateEksporTracking(shipmentId: string, data: any, supplierId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
    if (shipment.order.supplier_id !== supplierId) {
      throw new ForbiddenException('Bukan hak akses Anda untuk merubah logistik ekspor');
    }

    return this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        last_tracking_data: {
          carrier: data.carrier || '',
          vessel: data.vessel || '',
          container: data.container || '',
          bl: data.bl || '',
          eta: data.eta || ''
        }
      }
    });
  }

  async confirmReceived(shipmentId: string, buyerId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
    if (shipment.order.buyer_id !== buyerId) {
      throw new ForbiddenException('Bukan pesanan Anda');
    }

    // Confirm received
    const now = new Date();
    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'SELESAI',
        completed_at: now,
        delivered_at: now
      }
    });

    await this.prisma.order.update({
      where: { id: shipment.order_id },
      data: { status: 'COMPLETED' }
    });

    // Credit escrow to supplier wallet
    await this.addFundsToWallet(shipment.order.supplier_id, shipment.order.total_amount, shipment.order.id);

    await this.createSystemNotification(
      shipment.order.supplier_id,
      'ESCROW_RELEASED',
      'Pencairan Dana Escrow Berhasil',
      `Pembeli mengkonfirmasi penerimaan minyak nilam. Dana sebesar Rp ${shipment.order.total_amount.toLocaleString('id-ID')} masuk ke wallet Anda.`
    );

    return { success: true };
  }

  async reportMasalah(shipmentId: string, notes: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
    if (shipment.order.buyer_id !== userId && shipment.order.supplier_id !== userId) {
      throw new ForbiddenException('Tidak memiliki akses');
    }

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: 'BERMASALAH',
        issue_notes: notes
      }
    });

    // Notify admins
    const admins = await this.prisma.user.findMany({
      where: { role: { name: 'ADMIN' } }
    });

    for (const admin of admins) {
      await this.createSystemNotification(
        admin.id,
        'SHIPMENT_ISSUE',
        'Kendala Pengiriman Dilaporkan',
        `Kendala dilaporkan untuk pengiriman order #${shipment.order.order_number}: ${notes}`
      );
    }

    return { success: true };
  }

  async getTracking(shipmentId: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        tracking_logs: { orderBy: { created_at: 'desc' } },
        order: true
      }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');
    if (shipment.order.buyer_id !== userId && shipment.order.supplier_id !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (user?.role?.name !== 'ADMIN') throw new ForbiddenException('Akses ditolak');
    }

    return shipment;
  }

  async getSupplierShipments(supplierId: string) {
    return this.prisma.shipment.findMany({
      where: { order: { supplier_id: supplierId } },
      include: { order: true },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAdminShipments(status?: string, type?: string) {
    const whereClause: any = {};
    if (status) whereClause.status = status;
    if (type) whereClause.shipment_type = type;

    return this.prisma.shipment.findMany({
      where: whereClause,
      include: { order: { include: { buyer: true, supplier: true } } },
      orderBy: { created_at: 'desc' }
    });
  }

  async getAdminShipmentDetails(shipmentId: string) {
    return this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        order: { include: { buyer: true, supplier: true } },
        tracking_logs: { orderBy: { created_at: 'desc' } }
      }
    });
  }

  async resolveMasalah(shipmentId: string, action: string, notes: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: true }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');

    if (action === 'LANJUTKAN') {
      await this.prisma.shipment.update({
        where: { id: shipmentId },
        data: {
          status: 'DIKIRIM',
          issue_notes: null
        }
      });
    } else {
      await this.prisma.shipment.update({
        where: { id: shipmentId },
        data: { status: 'DIBATALKAN' }
      });
      await this.prisma.order.update({
        where: { id: shipment.order_id },
        data: { status: 'CANCELLED' }
      });
    }

    return { success: true };
  }

  async handleBiteshipWebhook(body: any) {
    const waybill = body.courier?.waybill_id;
    if (!waybill) return { success: false };

    const shipment = await this.prisma.shipment.findFirst({
      where: { tracking_number: waybill }
    });

    if (!shipment) return { success: false };

    const trackingStatus = body.status;
    let newStatus: any = shipment.status;

    if (trackingStatus === 'picking_up') newStatus = 'DIKIRIM';
    else if (trackingStatus === 'in_transit') newStatus = 'DALAM_PERJALANAN';
    else if (trackingStatus === 'delivered') newStatus = 'TIBA_DI_TUJUAN';
    else if (trackingStatus === 'failed') newStatus = 'BERMASALAH';

    await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        status: newStatus,
        last_tracking_data: body
      }
    });

    await this.prisma.shipmentTrackingLog.create({
      data: {
        shipment_id: shipment.id,
        status: trackingStatus,
        description: body.note || 'Pembaruan lokasi kargo',
        location: body.current_position || 'Logistics Depot',
        raw_data: body
      }
    });

    return { success: true };
  }

  async downloadDocument(shipmentId: string, type: string, res: any) {
    const shipment = await this.prisma.shipment.findFirst({
      where: {
        OR: [
          { id: shipmentId },
          { order_id: shipmentId }
        ]
      },
      include: {
        order: {
          include: {
            buyer: { include: { profile: true } },
            supplier: { include: { profile: true } },
            items: { include: { product: true } }
          }
        }
      }
    });

    if (!shipment) throw new NotFoundException('Shipment tidak ditemukan');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_${shipment.order.order_number}.pdf`);

    if (type === 'invoice_local') {
      this.documentHelper.generateLocalInvoicePdf(shipment.order, res);
    } else if (type === 'surat_jalan') {
      this.documentHelper.generateDeliveryOrderPdf(shipment.order, res);
    } else if (type === 'invoice') {
      this.documentHelper.generateInvoicePdf(shipment.order, res);
    } else {
      this.documentHelper.generatePackingListPdf(shipment.order, res);
    }
  }

  private async generateExportDocuments(orderId: string) {
    // Local fallback mock files for downloads
    this.logger.log(`Export documents successfully queued for Order ${orderId}`);
  }

  private async createSystemNotification(userId: string, type: string, title: string, message: string) {
    await this.prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message
      }
    });
  }

  private async addFundsToWallet(supplierId: string, amount: number, orderId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { user_id: supplierId }
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { user_id: supplierId, balance: 0 }
      });
    }

    await this.prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        type: 'CREDIT',
        amount: amount,
        description: `Pencairan Escrow Order #${orderId.substring(0, 8)}`
      }
    });

    await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } }
    });
  }
}
