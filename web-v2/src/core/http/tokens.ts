import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';

/**
 * Every backend service sits behind one gateway, so v1's per-service clients (`DIKeys.BiClient`, `CaasClient`, ...)
 * are one client here. Add a token when a service moves to its own URL.
 */
export const ApiClient = token<KyInstance>('ApiClient');

/**
 * The same gateway as `ApiClient`, plus the `access-token` header the ingestion scheduler requires on `source/*`,
 * `job/*` and `schedule/*` (backend `schedule_service.access_token`); without it they answer 500 "unauthorized access".
 */
export const SchedulerClient = token<KyInstance>('SchedulerClient');
