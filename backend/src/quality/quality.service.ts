import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierStorageService } from '../supplier/supplier-storage.service';
import { Actor, assertTransition, publicReportWhere } from './quality.policy';
import {
  PartnerDto,
  ReportDto,
  RequestDto,
  ReviewDto,
  TransitionDto,
} from './quality.dto';

@Injectable()
export class QualityService {
  constructor(
    private readonly db: PrismaService,
    private readonly storage: SupplierStorageService,
  ) {}

  private async transaction<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(work, {
          isolationLevel: 'Serializable',
          timeout: 15000,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2034', 'P2002'].includes(error.code) &&
          attempt < 3
        )
          continue;
        throw error;
      }
    }
  }
  private async batch(tx: Prisma.TransactionClient, id: string, actor: Actor) {
    const p = await tx.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Batch not found');
    if (actor.role !== 'admin' && p.supplier_id !== actor.userId)
      throw new ForbiddenException('Not your batch');
    return p;
  }
  private notify(
    tx: Prisma.TransactionClient,
    user_id: string,
    title: string,
    message: string,
  ) {
    return tx.notification.create({
      data: {
        user_id,
        type: 'QUALITY',
        title,
        message,
        action_url: '/dashboard/supplier/testing',
      },
    });
  }
  private snapshot(p: { name: string; kind: string }) {
    return { name: p.name, kind: p.kind };
  }

  partners(admin = false, accepting = false) {
    return this.db.testingPartner
      .findMany({
        where: admin
          ? {}
          : accepting
            ? { status: 'ACTIVE', accepting_requests: true }
            : { visible: true, publish_name: true },
        select: admin
          ? undefined
          : {
              id: true,
              name: true,
              kind: true,
              logo_url: true,
              publish_logo: true,
              services: true,
              instructions: true,
              fees: true,
              sample_requirements: true,
              turnaround: true,
              result_channel: true,
              status: true,
              accepting_requests: true,
            },
        orderBy: { created_at: 'asc' },
      })
      .then((rows) =>
        admin
          ? rows
          : rows.map((p) => ({
              ...p,
              logo_url: p.publish_logo ? p.logo_url : null,
            })),
      );
  }
  async savePartner(data: PartnerDto, id?: string) {
    if (data.accepting_requests && data.status !== 'ACTIVE')
      throw new BadRequestException('Only active partners accept requests');
    if (data.visible && !data.publish_name)
      throw new BadRequestException('Name publication permission required');
    if (id) return this.db.testingPartner.update({ where: { id }, data });
    return this.db.testingPartner.create({ data });
  }
  issuers() {
    return this.db.testingPartner.findMany({
      select: { id: true, name: true, status: true },
      orderBy: { name: 'asc' },
    });
  }
  async partnerDetail(id: string) {
    const partner = await this.db.testingPartner.findUnique({
      where: { id },
      include: {
        files: { select: { id: true, name: true, created_at: true } },
        _count: { select: { requests: true, reports: true } },
      },
    });
    if (!partner) throw new NotFoundException();
    return partner;
  }
  async list(actor: Actor) {
    const where = actor.role === 'admin' ? {} : { supplier_id: actor.userId };
    const [requests, reports, batches, notifications, legacy_records] =
      await Promise.all([
        this.db.testingRequest.findMany({
          where,
          include: {
            product: { select: { batch_code: true } },
            events: { orderBy: { created_at: 'asc' } },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.db.labReport.findMany({
          where:
            actor.role === 'admin'
              ? {}
              : { product: { supplier_id: actor.userId } },
          include: {
            product: { select: { batch_code: true } },
            events: { orderBy: { created_at: 'asc' } },
          },
          orderBy: { created_at: 'desc' },
        }),
        this.db.product.findMany({
          where,
          select: { id: true, batch_code: true, is_demo: true },
          orderBy: { created_at: 'desc' },
        }),
        this.db.notification.findMany({
          where: { user_id: actor.userId, type: 'QUALITY' },
          orderBy: { created_at: 'desc' },
          take: 50,
        }),
        this.db.product.findMany({
          where: {
            ...where,
            OR: [
              { qc_result: { isNot: null } },
              { certificate: { isNot: null } },
            ],
          },
          select: {
            id: true,
            batch_code: true,
            is_demo: true,
            qc_result: {
              select: {
                lab_name: true,
                report_number: true,
                source_document_url: true,
                pa_percentage: true,
                moisture: true,
                specific_gravity: true,
                refractive_index: true,
                optical_rotation: true,
                tested_at: true,
              },
            },
            certificate: { select: { review_status: true } },
          },
        }),
      ]);
    return { requests, reports, batches, notifications, legacy_records };
  }
  async createRequest(actor: Actor, dto: RequestDto) {
    return this.transaction(async (tx) => {
      const p = await this.batch(tx, dto.product_id, actor);
      const key = `${actor.userId}:${dto.key}`;
      const existing = await tx.testingRequest.findUnique({
        where: { request_key: key },
      });
      if (existing) {
        if (
          existing.product_id !== dto.product_id ||
          existing.partner_id !== dto.partner_id ||
          existing.service !== dto.service
        )
          throw new ConflictException('Key reused with different request');
        return existing;
      }
      const partner = await tx.testingPartner.findUnique({
        where: { id: dto.partner_id },
      });
      if (
        !partner ||
        partner.status !== 'ACTIVE' ||
        !partner.accepting_requests
      )
        throw new BadRequestException('Partner does not accept requests');
      if (!partner.services.includes(dto.service))
        throw new BadRequestException(
          'Service is not configured; contact admin',
        );
      const duplicate = await tx.testingRequest.findFirst({
        where: {
          product_id: p.id,
          partner_id: partner.id,
          service: dto.service,
          status: { notIn: ['CANCELLED', 'RESULTS_AVAILABLE'] },
        },
      });
      if (duplicate)
        throw new ConflictException(
          'An active request already exists for this batch and service',
        );
      const r = await tx.testingRequest.create({
        data: {
          product_id: p.id,
          supplier_id: p.supplier_id,
          partner_id: partner.id,
          partner_snapshot: this.snapshot(partner),
          service: dto.service,
          sample_identity: dto.sample_identity,
          notes: dto.notes,
          request_key: key,
          number: `VLM-UJI-${randomUUID().toUpperCase()}`,
        },
      });
      await tx.qualityEvent.create({
        data: {
          request_id: r.id,
          actor_id: actor.userId,
          actor_role: actor.role,
          action: 'SUBMITTED',
          notes: dto.notes,
          action_key: `request:${key}`,
        },
      });
      await this.notify(
        tx,
        p.supplier_id,
        'Pengajuan tercatat / Request recorded',
        `${r.number}: menunggu koordinasi admin / awaiting admin coordination.`,
      );
      return r;
    });
  }
  async transition(actor: Actor, id: string, dto: TransitionDto) {
    return this.transaction(async (tx) => {
      const r = await tx.testingRequest.findUnique({ where: { id } });
      if (!r) throw new NotFoundException();
      await this.batch(tx, r.product_id, actor);
      const action_key = `transition:${actor.userId}:${id}:${dto.key}`;
      const previous = await tx.qualityEvent.findUnique({
        where: { action_key },
      });
      if (previous) {
        if (previous.action !== dto.status)
          throw new ConflictException('Key reused');
        return r;
      }
      assertTransition(r.status, dto.status, actor);
      if (dto.status === 'SHIPPED' && !dto.shipping_info?.trim())
        throw new BadRequestException('Shipping information required');
      const updated = await tx.testingRequest.update({
        where: { id },
        data: {
          status: dto.status,
          ...(dto.status === 'SHIPPED'
            ? {
                shipping_info: dto.shipping_info,
                shipping_evidence: dto.evidence,
              }
            : {}),
        },
      });
      await tx.qualityEvent.create({
        data: {
          request_id: id,
          actor_id: actor.userId,
          actor_role: actor.role,
          action: dto.status,
          notes: dto.notes,
          evidence: dto.evidence,
          action_key,
        },
      });
      if (dto.status === 'RECEIVED')
        await this.notify(
          tx,
          r.supplier_id,
          'Sampel diterima / Sample received',
          `${r.number}: dicatat admin berdasarkan konfirmasi mitra / recorded by admin from partner confirmation.`,
        );
      return updated;
    });
  }
  async upload(
    actor: Actor,
    scope: 'batch' | 'partner',
    id: string,
    file: Express.Multer.File,
  ) {
    if (
      !file ||
      file.mimetype !== 'application/pdf' ||
      file.size > 5 * 1024 * 1024 ||
      file.buffer.subarray(0, 5).toString() !== '%PDF-'
    )
      throw new BadRequestException('Upload a PDF up to 5 MB');
    if (scope === 'partner') {
      if (actor.role !== 'admin') throw new ForbiddenException();
      await this.partnerDetail(id);
    } else await this.batch(this.db, id, actor);
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    const existing = await this.db.qualityFile.findFirst({
      where: {
        uploaded_by: actor.userId,
        sha256,
        ...(scope === 'batch' ? { product_id: id } : { partner_id: id }),
      },
    });
    if (existing) return { id: existing.id, name: existing.name };
    const saved = await this.storage.uploadDocument(
      `quality-${scope}-${id}-${randomUUID()}`,
      'COA',
      file,
      true,
    );
    const result = await this.db.qualityFile.create({
      data: {
        ...(scope === 'batch' ? { product_id: id } : { partner_id: id }),
        uploaded_by: actor.userId,
        storage_path: saved.path,
        name: file.originalname,
        size: file.size,
        sha256,
      },
    });
    return { id: result.id, name: result.name };
  }
  async createReport(actor: Actor, dto: ReportDto) {
    return this.transaction(async (tx) => {
      const p = await this.batch(tx, dto.product_id, actor);
      const request_key = `report:${actor.userId}:${dto.key}`;
      const existing = await tx.labReport.findUnique({
        where: { request_key },
      });
      if (existing) {
        if (existing.product_id !== p.id || existing.file_id !== dto.file_id)
          throw new ConflictException('Key reused');
        return existing;
      }
      const partner = await tx.testingPartner.findUnique({
        where: { id: dto.partner_id },
      });
      if (!partner) throw new NotFoundException('Issuer not found');
      const file = await tx.qualityFile.findUnique({
        where: { id: dto.file_id },
      });
      if (
        !file ||
        file.product_id !== p.id ||
        (actor.role !== 'admin' && file.uploaded_by !== actor.userId)
      )
        throw new BadRequestException(
          'File must belong to this batch and uploader',
        );
      if (dto.request_id) {
        const r = await tx.testingRequest.findUnique({
          where: { id: dto.request_id },
        });
        if (
          !r ||
          r.product_id !== p.id ||
          r.partner_id !== partner.id ||
          r.status === 'CANCELLED'
        )
          throw new BadRequestException('Report/request mismatch');
      }
      if (dto.replaces_id) {
        const old = await tx.labReport.findUnique({
          where: { id: dto.replaces_id },
        });
        if (!old || old.product_id !== p.id || old.partner_id !== partner.id)
          throw new BadRequestException(
            'Replacement must refer to the same batch and issuer',
          );
      }
      const duplicate = await tx.labReport.findFirst({
        where: {
          product_id: p.id,
          partner_id: partner.id,
          report_number: dto.report_number,
          replaces_id: dto.replaces_id ?? null,
          file: { sha256: file.sha256 },
        },
      });
      if (duplicate) return duplicate;
      const r = await tx.labReport.create({
        data: {
          product_id: p.id,
          partner_id: partner.id,
          request_id: dto.request_id,
          file_id: file.id,
          issuer_snapshot: this.snapshot(partner),
          report_number: dto.report_number,
          sample_identity: dto.sample_identity,
          tested_at: dto.tested_at ? new Date(dto.tested_at) : null,
          issued_at: dto.issued_at ? new Date(dto.issued_at) : null,
          parameters: dto.parameters as unknown as Prisma.InputJsonValue,
          conclusion: dto.conclusion,
          source: dto.source,
          uploaded_by: actor.userId,
          publication_allowed: dto.publication_allowed,
          is_demo: p.is_demo || dto.is_demo,
          replaces_id: dto.replaces_id,
          request_key,
        },
      });
      await tx.qualityEvent.create({
        data: {
          report_id: r.id,
          actor_id: actor.userId,
          actor_role: actor.role,
          action: 'PENDING',
          notes: dto.source,
          action_key: request_key,
        },
      });
      return r;
    });
  }
  async review(actor: Actor, id: string, dto: ReviewDto) {
    if (actor.role !== 'admin') throw new ForbiddenException();
    return this.transaction(async (tx) => {
      const r = await tx.labReport.findUnique({
        where: { id },
        include: { product: true, request: true },
      });
      if (!r) throw new NotFoundException();
      const action_key = `review:${actor.userId}:${id}:${dto.key}`;
      const previous = await tx.qualityEvent.findUnique({
        where: { action_key },
      });
      if (previous) {
        if (previous.action !== dto.status)
          throw new ConflictException('Key reused');
        return r;
      }
      if (
        dto.status === 'REVOKED'
          ? r.review_status !== 'APPROVED'
          : r.review_status !== 'PENDING'
      )
        throw new BadRequestException(
          'Replace the document to submit a correction; review history is immutable',
        );
      if (dto.status === 'APPROVED') {
        if (
          !dto.checklist ||
          !(
            [
              'issuer',
              'batch_sample',
              'report_number',
              'dates',
              'completeness',
            ] as const
          ).every((k) => dto.checklist![k] === true)
        )
          throw new BadRequestException('Complete every document check');
        if (
          r.request &&
          !['TESTING', 'RESULTS_AVAILABLE'].includes(r.request.status)
        )
          throw new BadRequestException(
            'Confirm testing progress first; existing reports can be submitted without a request',
          );
      }
      const updated = await tx.labReport.update({
        where: { id },
        data: {
          review_status: dto.status,
          review_notes: dto.notes,
          reviewed_by: actor.userId,
          reviewed_at: new Date(),
          review_checklist: dto.checklist
            ? (dto.checklist as unknown as Prisma.InputJsonValue)
            : undefined,
        },
      });
      if (dto.status === 'APPROVED' && !r.is_demo && !r.product.is_demo) {
        // Publishing still requires the supplier's explicit price/listing step.
        await tx.product.updateMany({
          where: { id: r.product_id, status: { in: ['DRAFT', 'IN_LAB'] } },
          data: { status: 'AWAITING_PRICE' },
        });
      }
      await tx.qualityEvent.create({
        data: {
          report_id: id,
          actor_id: actor.userId,
          actor_role: actor.role,
          action: dto.status,
          notes: dto.notes,
          action_key,
        },
      });
      if (dto.status === 'APPROVED' && r.replaces_id) {
        const old = await tx.labReport.findUniqueOrThrow({
          where: { id: r.replaces_id },
        });
        if (old.review_status === 'APPROVED') {
          await tx.labReport.update({
            where: { id: old.id },
            data: { review_status: 'SUPERSEDED' },
          });
          await tx.qualityEvent.create({
            data: {
              report_id: old.id,
              actor_id: actor.userId,
              actor_role: actor.role,
              action: 'SUPERSEDED',
              notes: id,
              action_key: `superseded:${id}`,
            },
          });
        }
      }
      if (
        dto.status === 'APPROVED' &&
        r.request &&
        r.request.status === 'TESTING' &&
        !r.is_demo &&
        !r.product.is_demo
      ) {
        await tx.testingRequest.update({
          where: { id: r.request.id },
          data: { status: 'RESULTS_AVAILABLE' },
        });
        await tx.qualityEvent.create({
          data: {
            request_id: r.request.id,
            report_id: id,
            actor_id: actor.userId,
            actor_role: actor.role,
            action: 'RESULTS_AVAILABLE',
            notes: dto.notes,
            action_key: `results:${r.id}`,
          },
        });
      }
      if (
        dto.status === 'REVOKED' &&
        r.request?.status === 'RESULTS_AVAILABLE'
      ) {
        const remaining = await tx.labReport.count({
          where: {
            request_id: r.request.id,
            review_status: 'APPROVED',
            is_demo: false,
          },
        });
        if (!remaining) {
          await tx.testingRequest.update({
            where: { id: r.request.id },
            data: { status: 'TESTING' },
          });
          await tx.qualityEvent.create({
            data: {
              request_id: r.request.id,
              report_id: id,
              actor_id: actor.userId,
              actor_role: actor.role,
              action: 'TESTING',
              notes: `Report revoked: ${dto.notes}`,
              action_key: `revocation:${r.id}`,
            },
          });
        }
      }
      if (dto.status === 'APPROVED' || dto.status === 'REVISION_REQUESTED')
        await this.notify(
          tx,
          r.product.supplier_id,
          dto.status === 'APPROVED'
            ? 'Hasil tersedia / Results available'
            : 'Perbaiki dokumen / Document correction required',
          `${r.report_number}: ${dto.notes}`,
        );
      return updated;
    });
  }
  async publicReports(productId: string) {
    const p = await this.db.product.findFirst({
      where: { id: productId, status: 'VERIFIED' },
    });
    if (!p) throw new NotFoundException();
    if (p.is_demo) return [];
    return this.db.labReport.findMany({
      where: {
        product_id: productId,
        ...publicReportWhere,
        partner: { publish_reports: true, publish_name: true },
      },
      select: {
        id: true,
        issuer_snapshot: true,
        report_number: true,
        sample_identity: true,
        tested_at: true,
        issued_at: true,
        parameters: true,
        conclusion: true,
        review_status: true,
        evaluation_status: true,
        reviewed_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
  async document(id: string, actor?: Actor) {
    const r = await this.db.labReport.findUnique({
      where: { id },
      include: { product: true, partner: true, file: true },
    });
    if (!r) throw new NotFoundException();
    const owner =
      actor?.role === 'admin' ||
      (actor?.role === 'supplier' && actor.userId === r.product.supplier_id);
    const isPublic =
      r.product.status === 'VERIFIED' &&
      !r.product.is_demo &&
      !r.is_demo &&
      r.review_status === 'APPROVED' &&
      r.publication_allowed &&
      r.partner.publish_reports &&
      r.partner.publish_name;
    if (!owner && !isPublic) throw new ForbiddenException('Private document');
    return this.storage.openDocument(r.file.storage_path);
  }
  async agreement(id: string, actor: Actor) {
    if (actor.role !== 'admin') throw new ForbiddenException();
    const file = await this.db.qualityFile.findUnique({ where: { id } });
    if (!file?.partner_id) throw new NotFoundException();
    return this.storage.openDocument(file.storage_path);
  }
}
