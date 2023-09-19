/*
 * @author: tvc12 - Thien Vi
 * @created: 5/7/21, 5:48 PM
 */

import { getOriginalMethod } from '@/shared/profiler/Annotation';
import { isFunction } from 'lodash';
import { Di } from '@core/common/modules';
import { TrackingService } from '@core/tracking/service';
import { Log } from '@core/utils';

export interface EventProperties {
  [key: string]: any;
}

export interface FunctionProperties {
  [key: string]: (vm: Vue) => any;
}

interface EventOption {
  name: string;
  properties?: EventProperties | FunctionProperties;
}

function getFinalProperties(that: any, properties: EventProperties | FunctionProperties, args: any) {
  const newProperties = {};
  Object.entries(properties ?? {}).forEach(([key, value]) => {
    if (isFunction(value)) {
      Object.assign(newProperties, {
        [key]: value.call(that, that, args)
      });
    } else {
      Object.assign(newProperties, {
        [key]: value
      });
    }
  });
  return newProperties;
}

function execute(originalFunction: Function, option: EventOption) {
  return function(...args: any[]) {
    // @ts-ignored
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    try {
      const newProperties = getFinalProperties(that, option.properties ?? {}, args);
      Di.get(TrackingService).track(option.name ?? '', newProperties);
    } catch (e) {
      Log.error('TrackAnotation::execute::error::', e.message);
    }
    return originalFunction.apply(that, args);
  };
}

function wrapMethod(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>, option: EventOption) {
  if (!descriptor || key === 'constructor') {
    return;
  }

  const originalFunction = getOriginalMethod(descriptor);

  if (!originalFunction || typeof originalFunction !== 'function') {
    return;
  }

  // set a tag so we don't wrap a function twice
  const savedName = `__track_${key as any}__`;

  if (Reflect.has(target, savedName)) {
    return;
  }

  Reflect.set(target, savedName, originalFunction);

  if (descriptor.value) {
    descriptor.value = execute(originalFunction, option);
  } else if (descriptor.get) {
    descriptor.get = execute(originalFunction, option);
  } else if (descriptor.set) {
    descriptor.set = execute(originalFunction, option);
  }
}

/**
 * Cho phép track trực tiếp 1 method
 * export default MyData extends Vue {
 *  private get isMobile() => true
 *
 *  // using instance vue
 *  @Track('view_name', { path: router.path, isMobile: (vm: MyData) => vm.isMobile } )
 *  mounted() {
 *    // doing
 *  }
 *  // using function
 *  @Track('view_name', { path: router.path, isMobile: function() { return this.isMobile } } )
 *  onPageChange(') {
 *    //doing
 *  }
 * */
export function Track(eventName: string, properties?: EventProperties | FunctionProperties) {
  return (target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    if (key && descriptor) {
      wrapMethod(target, key, descriptor, { name: eventName, properties: properties });
      return;
    }
  };
}
