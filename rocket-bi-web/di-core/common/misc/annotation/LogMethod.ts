import { Log } from '@core/utils/Log';
import { Annotation } from './Annotation';

/**
 * Log method annotation used to log method name and arguments
 * usage:
 * <pre>
 * class YourClass {
 *  @LogDebug()
 *  yourMethod() {
 *    // do something
 *  }
 *}
 * </pre>
 */
export const LogDebug: (target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => void = Annotation.create(
  (key: PropertyKey) => `__di_log_debug_${String(key)}__`,
  {
    beforeOriginFn: (key: PropertyKey, args: any[]) => {
      Log.debug('LogDebug::method', key, 'args', args);
    }
  }
);

/**
 * Log method annotation used to log method name and arguments
 * usage:
 *<pre>
 *  @LogInfo()
 *  yourMethod() {
 *    // do something
 *  }
 *</pre>
 */
export const LogInfo: (target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => void = Annotation.create(
  (key: PropertyKey) => `__di_log_ingo_${String(key)}__`,
  {
    beforeOriginFn: (key: PropertyKey, args: any[]) => {
      Log.info('LogInfo::method', key, 'args', args);
    }
  }
);

/**
 * Trace method annotation used to log method name and arguments
 * usage:
 * <pre>
 * @LogTrace()
 * yourMethod() {
 *  // do something
 *  }
 * </pre>
 */
export const LogTrace: (target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => void = Annotation.create(
  (key: PropertyKey) => `__di_log_trace_${String(key)}__`,
  {
    beforeOriginFn: (key: PropertyKey, args: any[]) => {
      Log.trace('LogTrace::method', key, 'args', args);
    }
  }
);
