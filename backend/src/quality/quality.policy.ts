import { BadRequestException, ForbiddenException } from '@nestjs/common';
export type Actor = { userId: string; role: string };
export const NEXT: Record<string, string[]> = {
  SUBMITTED: ['AWAITING_SHIPMENT', 'CANCELLED'],
  AWAITING_SHIPMENT: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['TESTING', 'CANCELLED'],
  TESTING: ['CANCELLED'],
  RESULTS_AVAILABLE: [],
  CANCELLED: [],
};
export function assertTransition(from: string, to: string, actor: Actor) {
  if (!NEXT[from]?.includes(to))
    throw new BadRequestException('Invalid testing status transition');
  if (actor.role !== 'admin' && !['SHIPPED', 'CANCELLED'].includes(to))
    throw new ForbiddenException('Admin confirmation required');
  if (
    actor.role !== 'admin' &&
    to === 'CANCELLED' &&
    !['SUBMITTED', 'AWAITING_SHIPMENT'].includes(from)
  )
    throw new ForbiddenException('Contact admin to cancel after shipment');
}
export const publicReportWhere = {
  review_status: 'APPROVED',
  is_demo: false,
  publication_allowed: true,
  partner: { publish_reports: true },
};
export function isBadgeEligible(
  report: { review_status: string; is_demo: boolean },
  productDemo: boolean,
) {
  return !productDemo && !report.is_demo && report.review_status === 'APPROVED';
}
