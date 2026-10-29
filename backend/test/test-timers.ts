import { INestApplication } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

// Deterministic test harness: expiry is exercised explicitly by business tests.
// No background timer may race fixture cleanup or survive app.close().
export function stopTestTimers(app: INestApplication) {
  if (process.env.NODE_ENV !== 'test' || process.env.PERTAMUDA_TEST_MODE !== 'true') {
    throw new Error('Test timer control requires the explicit isolated test runner');
  }
  const registry = app.get(SchedulerRegistry);
  for (const name of registry.getIntervals()) registry.deleteInterval(name);
  for (const name of registry.getCronJobs().keys()) registry.deleteCronJob(name);
}
