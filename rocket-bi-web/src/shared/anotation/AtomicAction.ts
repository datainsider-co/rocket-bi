/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 5:48 PM
 */

import { getOriginalFunction } from '@/shared/profiler/Annotation';

export interface AtomicActionAnnotationOption {
  name?: string;
  timeUnlockAfterComplete?: number;
}

const methodsRunning = new Set<string>();

function isNonLocking(key: string): boolean {
  return !methodsRunning.has(key);
}

function lock(key: string): void {
  methodsRunning.add(key);
}

function unlock(key: string): void {
  methodsRunning.delete(key);
}

function buildKey(className: string, propertyKey: PropertyKey, option?: AtomicActionAnnotationOption): string {
  return `${className}:${option?.name || (propertyKey as any)}`;
}

function wrapWithLockingMethod(memKey: string, originalFunction: Function, option?: AtomicActionAnnotationOption) {
  return function(...args: any[]) {
    if (isNonLocking(memKey)) {
      lock(memKey);
      // @ts-ignored
      const result = originalFunction.apply(this, args);
      if (result && result instanceof Promise) {
        return (result as Promise<any>).finally(() => {
          setTimeout(() => unlock(memKey), option?.timeUnlockAfterComplete);
        });
      } else {
        setTimeout(() => unlock(memKey), option?.timeUnlockAfterComplete);
        return result;
      }
    }
  };
}

function wrapMethod(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>, option?: AtomicActionAnnotationOption) {
  if (!descriptor || key === 'constructor') {
    return;
  }

  const originalFunction = getOriginalFunction(descriptor);

  if (!originalFunction || typeof originalFunction !== 'function') {
    return;
  }
  const className = target.constructor ? `${target.constructor.name}` : '';
  const memKey = buildKey(className, key, option);

  // set a tag so we don't wrap a function twice
  const savedName = `__atomic_${key as any}__`;

  if (Reflect.has(target, savedName)) {
    return;
  }

  Reflect.set(target, savedName, originalFunction);

  if (descriptor.value) {
    descriptor.value = wrapWithLockingMethod(memKey, originalFunction, option);
  } else if (descriptor.get) {
    descriptor.get = wrapWithLockingMethod(memKey, originalFunction, option);
  } else if (descriptor.set) {
    descriptor.set = wrapWithLockingMethod(memKey, originalFunction, option);
  }
}

export function AtomicAction(option?: AtomicActionAnnotationOption) {
  return (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    if (key && descriptor) {
      wrapMethod(target, key, descriptor, option);
      return;
    }
  };
}
