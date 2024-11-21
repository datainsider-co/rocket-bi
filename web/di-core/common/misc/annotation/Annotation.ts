import { Log } from '@core/utils/Log';

/**
 * Class create annotation easily
 */
export class Annotation {
  /**
   * create annotation, exception are swallowed
   * @param keyBuilder create cache key
   * @param callback method execute before and after
   * @param callback.beforeOriginFn method called before original method
   * @param callback.afterOriginFn method called after original method but before return
   */
  static create(
    keyBuilder: (key: PropertyKey) => string,
    callback: {
      beforeOriginFn?: (this: any, key: PropertyKey, ...args: any[]) => void;
      transformOriginFn?: (this: any, fn: () => any, key: PropertyKey, ...args: any[]) => void;
      afterOriginFn?: (this: any, key: PropertyKey, ...args: any[]) => void;
    }
  ) {
    return (target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
      Annotation.wrapMethod(target, key, descriptor, keyBuilder, callback);
    };
  }

  /**
   * wrap method, exception are swallowed
   */
  private static wrapMethod(
    target: object,
    key: PropertyKey,
    descriptor: TypedPropertyDescriptor<any>,
    keyBuilder: (key: PropertyKey) => string,
    callback: {
      beforeOriginFn?: (this: any, key: PropertyKey, ...args: any[]) => void;
      transformOriginFn?: (this: any, fn: () => any, key: PropertyKey, ...args: any[]) => void;
      afterOriginFn?: (this: any, key: PropertyKey, ...args: any[]) => void;
    }
  ) {
    if (!descriptor || key === 'constructor') {
      return;
    }
    const savedName = keyBuilder(key);
    if (Reflect.has(target, savedName)) {
      return;
    }
    const originalFn: any = Annotation.getOriginalFunction(descriptor);
    if (!originalFn || typeof originalFn !== 'function') {
      return;
    }
    Reflect.set(target, savedName, originalFn);

    const wrapperFn = function(this: any, ...args: any[]) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this;
      Annotation.executeFn(that, key, args, callback.beforeOriginFn);
      try {
        const applyOriginFn = () => originalFn.apply(that, args);
        const result = callback.transformOriginFn ? callback.transformOriginFn.apply(that, [applyOriginFn, key, ...args]) : applyOriginFn();
        if (result && result instanceof Promise) {
          return (result as Promise<any>).finally(() => Annotation.executeFn(that, key, args, callback.afterOriginFn));
        } else {
          Annotation.executeFn(that, key, args, callback.afterOriginFn);
          return result;
        }
      } catch (ex) {
        Annotation.executeFn(that, key, args, callback.afterOriginFn);
        throw ex;
      }
    };

    if (descriptor.value) {
      descriptor.value = wrapperFn;
    } else if (descriptor.get) {
      descriptor.get = wrapperFn;
    } else if (descriptor.set) {
      descriptor.set = wrapperFn;
    }
  }

  private static executeFn(thisObj: any, key: PropertyKey, args: any[], fn?: ((this: any, key: PropertyKey, ...args: any[]) => void) | undefined) {
    if (fn) {
      try {
        fn.apply(thisObj, [key, ...args]);
      } catch (ex) {
        Log.error('Annotation execute fn error', ex);
      }
    }
  }

  private static getOriginalFunction(descriptor: TypedPropertyDescriptor<any>): any {
    if (descriptor.value) {
      return descriptor.value;
    } else if (descriptor.get) {
      return descriptor.get;
    } else if (descriptor.set) {
      return descriptor.set;
    } else {
      return descriptor.value;
    }
  }
}
