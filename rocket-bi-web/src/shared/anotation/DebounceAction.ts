/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 5:48 PM
 */

import { getOriginalMethod } from '@/shared/profiler/Annotation';
import { TimeoutUtils } from '@/utils';
import { Log } from '@core/utils';

export interface DebounceActionAnnotationOption {
  name?: string;
  timeDebounce?: number;
}

function buildKey(className: string, propertyKey: PropertyKey, option?: DebounceActionAnnotationOption): string {
  return `${className}:${option?.name || (propertyKey as any)}`;
}

function wrapWithDebounceMethod(memKey: string, originalFunction: Function, option?: DebounceActionAnnotationOption) {
  return function(...args: any[]) {
    // @ts-ignored
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    const processId = that.debounce?.id || null;
    const newProcessId = TimeoutUtils.waitAndExec(processId, () => originalFunction.apply(that, args), option?.timeDebounce ?? 100);

    Object.assign(that, { debounce: newProcessId });
  };
}

function wrapMethod(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>, option?: DebounceActionAnnotationOption) {
  if (!descriptor || key === 'constructor') {
    return;
  }

  const originalFunction = getOriginalMethod(descriptor);

  if (!originalFunction || typeof originalFunction !== 'function') {
    return;
  }
  const className = target.constructor ? `${target.constructor.name}` : '';
  const memKey = buildKey(className, key, option);

  // set a tag so we don't wrap a function twice
  const savedName = `__debounce_${key as any}__`;

  if (Reflect.has(target, savedName)) {
    return;
  }

  Reflect.set(target, savedName, originalFunction);

  if (descriptor.value) {
    descriptor.value = wrapWithDebounceMethod(memKey, originalFunction, option);
  } else if (descriptor.get) {
    descriptor.get = wrapWithDebounceMethod(memKey, originalFunction, option);
  } else if (descriptor.set) {
    descriptor.set = wrapWithDebounceMethod(memKey, originalFunction, option);
  }
}

/**
 * trong 1 khoảng thời gian cố định sẽ excute function. Nếu trong thời gian debounce đang hiệu thì function request sau cùng sẽ được gọi
 * Hoạt động tốt với function không cần kết quả trả về (Void function)..
 * @param option
 * @constructor
 */
export function DebounceAction(option?: DebounceActionAnnotationOption) {
  return (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    if (key && descriptor) {
      wrapMethod(target, key, descriptor, option);
      return;
    }
  };
}
