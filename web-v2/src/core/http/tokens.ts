import type { KyInstance } from 'ky';
import { token } from '@/core/di/Container';

/**
 * Every backend service sits behind one gateway, so v1's per-service clients (`DIKeys.BiClient`, `CaasClient`, ...)
 * are one client here. Add a token when a service moves to its own URL.
 */
export const ApiClient = token<KyInstance>('ApiClient');
