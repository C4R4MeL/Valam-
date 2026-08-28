import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Writable } from 'stream';

@Injectable()
export class DocumentHelper {
  generateInvoicePdf(order: any, stream: Writable): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fillColor('#064e3b').fontSize(24).text('COMMERCIAL INVOICE', { align: 'center' }).moveDown();
    doc.fillColor('#000000').fontSize(10);

    // Metadata
    doc.text(`Invoice No: INV-${order.order_number}`);
    doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`);
    doc.text(`Incoterms: ${order.shipment?.incoterms || 'FOB'}`);
    doc.moveDown();

    // Parties
    doc.fontSize(12).font('Helvetica-Bold').text('Supplier Details:').font('Helvetica').fontSize(10);
    doc.text(order.supplier?.profile?.company_name || order.supplier?.email || 'Koperasi Produsen Nilam');
    doc.text(order.supplier?.profile?.address || 'Aceh, Indonesia');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Buyer Details:').font('Helvetica').fontSize(10);
    doc.text(order.buyer?.profile?.company_name || order.buyer?.email || 'Global Cosmetics Inc');
    doc.text(order.buyer?.profile?.address || 'Destination Port');
    doc.moveDown();

    // Items Table Header
    doc.fontSize(12).font('Helvetica-Bold').text('Items Summary:', { underline: true }).font('Helvetica').fontSize(10).moveDown();

    // Table
    order.items?.forEach((item: any, idx: number) => {
      doc.text(`${idx + 1}. Minyak Nilam (Patchouli Oil) - Qty: ${item.quantity_kg} kg @ Rp ${item.price_per_kg}/kg`);
      doc.text(`Subtotal: Rp ${item.subtotal.toLocaleString('id-ID')}`);
      doc.moveDown();
    });

    doc.text(`Grand Total Product Value: Rp ${order.total_amount.toLocaleString('id-ID')}`, { align: 'right' });
    
    doc.end();
  }

  generatePackingListPdf(order: any, stream: Writable): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fillColor('#064e3b').fontSize(24).text('EXPORT PACKING LIST', { align: 'center' }).moveDown();
    doc.fillColor('#000000').fontSize(10);

    doc.text(`Order No: ${order.order_number}`);
    doc.text(`Date: ${new Date().toLocaleDateString('id-ID')}`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Packaging Specifications:').font('Helvetica').fontSize(10);
    const drumCount = order.shipment?.drum_count || Math.ceil((order.items?.[0]?.quantity_kg || 100) / 180);
    doc.text(`Total Package: ${drumCount} Aluminum Drum(s)`);
    doc.text(`Capacity per Drum: 180 - 200 kg`);
    doc.text(`Total Cargo Weight: ${order.items?.[0]?.quantity_kg || 100} kg`);
    doc.text(`Dimensions per Drum: 60 x 60 x 90 cm`);
    doc.moveDown();

    doc.fontSize(12).font('Helvetica-Bold').text('Destination Logistics:').font('Helvetica').fontSize(10);
    doc.text(`Port of Origin: ${order.shipment?.port_origin || 'Port of Belawan'}`);
    doc.text(`Port of Destination: ${order.shipment?.port_destination || 'Port of Rotterdam'}`);
    doc.text(`Forwarder Courier: ${order.shipment?.forwarder_name || 'Maersk B2B Logistics'}`);
    doc.moveDown();

    doc.end();
  }

  generateLocalInvoicePdf(order: any, stream: Writable): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fillColor('#064e3b').fontSize(22).font('Helvetica-Bold').text('FAKTUR PENJUALAN (LOCAL INVOICE)', { align: 'center' }).moveDown();
    doc.fillColor('#000000').fontSize(10).font('Helvetica');

    // Metadata Table-like structure
    doc.text(`Nomor Faktur: INV-L-${order.order_number}`);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`);
    doc.text(`Status Pembayaran: PAID (Escrow Terverifikasi)`);
    doc.moveDown();

    // Parties
    doc.fontSize(11).font('Helvetica-Bold').text('Pemasok / Pengirim:').font('Helvetica').fontSize(10);
    doc.text(order.supplier?.profile?.company_name || order.supplier?.email || 'Koperasi Produsen Nilam');
    doc.text(order.supplier?.profile?.address || 'Aceh, Indonesia');
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').text('Pembeli / Penerima:').font('Helvetica').fontSize(10);
    doc.text(order.buyer?.profile?.company_name || order.buyer?.email || 'Mitra Industri Nilam');
    doc.text(order.buyer?.profile?.address || 'Alamat Penerima');
    doc.moveDown();

    // Items
    doc.fontSize(11).font('Helvetica-Bold').text('Rincian Transaksi:', { underline: true }).font('Helvetica').fontSize(10).moveDown();
    
    let subtotal = 0;
    order.items?.forEach((item: any, idx: number) => {
      subtotal += item.subtotal;
      doc.text(`${idx + 1}. Minyak Nilam (Patchouli Oil)`);
      doc.text(`   Volume: ${item.quantity_kg} kg @ Rp ${item.price_per_kg.toLocaleString('id-ID')}/kg`);
      doc.text(`   Jumlah: Rp ${item.subtotal.toLocaleString('id-ID')}`);
      doc.moveDown();
    });

    const shippingCost = order.shipping_cost || 0;
    const totalAmount = subtotal + shippingCost;

    doc.text(`Subtotal Produk: Rp ${subtotal.toLocaleString('id-ID')}`, { align: 'right' });
    doc.text(`Biaya Pengiriman (Kargo): Rp ${shippingCost.toLocaleString('id-ID')}`, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total Pembayaran: Rp ${totalAmount.toLocaleString('id-ID')}`, { align: 'right' });
    
    doc.end();
  }

  generateDeliveryOrderPdf(order: any, stream: Writable): void {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(stream);

    // Header
    doc.fillColor('#0f766e').fontSize(22).font('Helvetica-Bold').text('SURAT JALAN / DELIVERY ORDER', { align: 'center' }).moveDown();
    doc.fillColor('#000000').fontSize(10).font('Helvetica');

    // Metadata
    doc.text(`Nomor Surat Jalan: SJ-${order.order_number}`);
    doc.text(`Tanggal Kirim: ${new Date().toLocaleDateString('id-ID')}`);
    doc.moveDown();

    // Parties
    doc.fontSize(11).font('Helvetica-Bold').text('Pengirim:').font('Helvetica').fontSize(10);
    doc.text(order.supplier?.profile?.company_name || order.supplier?.email || 'Koperasi Produsen Nilam');
    doc.text(order.supplier?.profile?.address || 'Aceh, Indonesia');
    doc.moveDown();

    doc.fontSize(11).font('Helvetica-Bold').text('Alamat Tujuan / Penerima:').font('Helvetica').fontSize(10);
    doc.text(order.buyer?.profile?.company_name || order.buyer?.email || 'Mitra Industri Nilam');
    doc.text(order.buyer?.profile?.address || 'Alamat Tujuan');
    doc.moveDown();

    // Logistics & Packaging Specs
    doc.fontSize(11).font('Helvetica-Bold').text('Spesifikasi Muatan & Logistik:').font('Helvetica').fontSize(10);
    const drumCount = order.shipment?.drum_count || Math.ceil((order.items?.[0]?.quantity_kg || 100) / 180);
    doc.text(`Total Kemasan: ${drumCount} Aluminum Drum(s)`);
    doc.text(`Total Berat Bersih (Netto): ${order.items?.[0]?.quantity_kg || 100} kg`);
    doc.text(`Kurir/Ekspedisi: ${order.shipment?.courier_name || 'Biteship Cargo'}`);
    doc.text(`Nomor Resi / AWB: ${order.shipment?.tracking_number || 'Dalam Proses Penjemputan'}`);
    doc.moveDown();

    // Signature Block
    doc.moveDown(2);
    const startY = doc.y;
    doc.text('Diterima Oleh,', 50, startY);
    doc.text('Sopir/Kurir,', 225, startY);
    doc.text('Hormat Kami (Pemasok),', 400, startY);

    doc.moveDown(4);
    doc.text('( __________________ )', 50, doc.y);
    doc.text('( __________________ )', 225, doc.y);
    doc.text('( __________________ )', 400, doc.y);

    doc.end();
  }
}
