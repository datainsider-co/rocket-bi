import type { DiModule } from '@/core/di/Container';
import { HttpModule } from './HttpModule';

/** Bound in order when the app starts, like v1's `Di.init([...])`. Feature modules go after `HttpModule`. */
export const appModules: readonly DiModule[] = [HttpModule];
