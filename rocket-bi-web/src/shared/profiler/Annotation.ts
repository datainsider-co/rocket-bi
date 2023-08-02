/* tslint:disable:ban-types */

import { Container } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import {
  ClassProfilerAnnotationOption,
  MethodProfilerAnnotationOption,
  ProfileOutputData,
  Profiler,
  ProfilerAnnotationOption
} from '@/shared/profiler/Profiler';

function sortByNameFn(l: ProfileOutputData, r: ProfileOutputData) {
  try {
    const lname = l.name.split(':')[0];
    const rname = r.name.split(':')[0];
    return lname.localeCompare(rname);
  } catch (e) {
    return 0;
  }
}

function sortByCpuTimeFn(l: ProfileOutputData, r: ProfileOutputData) {
  return r.cpuTimePerSecond - l.cpuTimePerSecond;
}

export function getLongestFuncLength(data: ProfileOutputData[]): number {
  if (data && data.length > 0) {
    return (
      data
        .map(item => {
          return item.name;
        })
        .reduce((previousValue, currentValue) => {
          if (previousValue.length >= currentValue.length) {
            return previousValue;
          } else {
            return currentValue;
          }
        }).length + 2
    );
  } else {
    return 2;
  }
}

export function outputProfilerData(data: ProfileOutputData[], totalCpu: number, totalTicks: number) {
  data.sort((l: ProfileOutputData, r: ProfileOutputData) => {
    const flag = sortByNameFn(l, r);
    return !flag ? sortByCpuTimeFn(l, r) : flag;
  });
  const longestFuncLength = getLongestFuncLength(data);

  let output = '';
  //// Header line
  output += 'Function'.padEnd(longestFuncLength);
  output += 'Total Calls'.padStart(12);
  output += 'Last Cpu Time'.padStart(16);
  output += 'Min Cpu Time'.padStart(16);
  output += 'Max Cpu Time'.padStart(16);
  output += 'Avg Cpu Time/Call'.padStart(20);
  output += 'Calls/Second'.padStart(16);
  output += 'Avg Cpu Time/Second'.padStart(20);
  output += '% of Total\n'.padStart(16);

  ////  Data lines
  data.forEach(d => {
    output += d.name.padEnd(longestFuncLength);
    output += `${d.calls}`.padStart(12);
    output += `${d.lastCpuTime.toFixed(2)}ms`.padStart(16);
    output += `${d.minCpuTime.toFixed(4)}ms`.padStart(16);
    output += `${d.maxCpuTime.toFixed(4)}ms`.padStart(16);
    output += `${d.cpuTimePerCall.toFixed(4)}ms`.padStart(20);
    output += `${d.callsPerSecond.toFixed(4)}`.padStart(16);
    output += `${d.cpuTimePerSecond.toFixed(4)}ms`.padStart(20);
    output += `${((d.cpuTimePerSecond / totalCpu) * 100).toFixed(0)} %\n`.padStart(16);
  });

  //// Footer line
  output += `\n\n${totalTicks} total ticks measured`;
  output += `\t\t\t${totalCpu.toFixed(2)} average CPU profiled per tick`;
  // eslint-disable-next-line no-console
  console.info(output);
}

function isEnabled(): boolean {
  const profiler: Profiler = Container.getValue(DIKeys.Profiler) as Profiler;
  return profiler.isEnabled();
}

function record(key: string | symbol, time: number) {
  const profiler: Profiler = Container.getValue(DIKeys.Profiler) as Profiler;

  profiler.record(key, time);
}

export function getOriginalFunction(descriptor: TypedPropertyDescriptor<any>, options?: ProfilerAnnotationOption) {
  if (descriptor.value) {
    return descriptor.value;
  } else if (descriptor.get && (options?.getIncluded ?? true)) {
    return descriptor.get;
  } else if (descriptor.set && (options?.setIncluded ?? true)) {
    return descriptor.set;
  } else {
    return descriptor.value;
  }
}

function buildProfilerKey(className: string, propertyKey: PropertyKey, option?: MethodProfilerAnnotationOption): string {
  const memKey = `${option?.prefix || className}:${option?.name || (propertyKey as any)}`;
  return memKey;
}

function wrapClass(target: object, key: PropertyKey, className: string, option?: ClassProfilerAnnotationOption) {
  const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
  if (!descriptor) {
    return;
  }
  if (key === 'constructor') {
    return;
  }

  const originalFunction = getOriginalFunction(descriptor, option);

  if (!originalFunction || typeof originalFunction !== 'function') {
    return;
  }
  const memKey = `${option?.prefix || className}:${key as any}`;
  const savedName = `__${key as any}__`;
  if (Reflect.has(target, savedName)) {
    return;
  }
  Reflect.set(target, savedName, originalFunction);
  Reflect.set(target, key, function(this: any, ...args: any[]) {
    if (isEnabled()) {
      const start = performance.now();
      const result = originalFunction.apply(this, args);
      if (result && result instanceof Promise) {
        return (result as Promise<any>).finally(() => {
          const end = performance.now();
          record(memKey, end - start);
        });
      } else {
        const end = performance.now();
        record(memKey, end - start);
        return result;
      }
    }
    return originalFunction.apply(this, args);
  });
}

function wrapMethod(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<any>, option?: MethodProfilerAnnotationOption) {
  if (!descriptor) {
    return;
  }

  if (key === 'constructor') {
    return;
  }

  const originalFunction = getOriginalFunction(descriptor);

  if (!originalFunction || typeof originalFunction !== 'function') {
    return;
  }
  const className = target.constructor ? `${target.constructor.name}` : '';
  const memKey = buildProfilerKey(className, key, option);

  // set a tag so we don't wrap a function twice
  const savedName = `__${key as any}__`;
  if (Reflect.has(target, savedName)) {
    return;
  }
  Reflect.set(target, savedName, originalFunction);
  if (descriptor.value) {
    descriptor.value = function(...args: any[]) {
      if (isEnabled()) {
        const start = performance.now();
        const result = originalFunction.apply(this, args);
        if (result && result instanceof Promise) {
          return (result as Promise<any>).finally(() => {
            const end = performance.now();
            record(memKey, end - start);
          });
        } else {
          const end = performance.now();
          record(memKey, end - start);

          return result;
        }
      }
      return originalFunction.apply(this, args);
    };
  } else if (descriptor.get) {
    descriptor.get = function(...args: any[]) {
      if (isEnabled()) {
        const start = performance.now();
        const result = originalFunction.apply(this, args);
        if (result && result instanceof Promise) {
          return (result as Promise<any>).finally(() => {
            const end = performance.now();
            record(memKey, end - start);
          });
        } else {
          const end = performance.now();
          record(memKey, end - start);

          return result;
        }
      }
      return originalFunction.apply(this, args);
    };
  } else if (descriptor.set) {
    descriptor.set = function(...args: any[]) {
      if (isEnabled()) {
        const start = performance.now();
        const result = originalFunction.apply(this, args);
        if (result && result instanceof Promise) {
          return (result as Promise<any>).finally(() => {
            const end = performance.now();
            record(memKey, end - start);
          });
        } else {
          const end = performance.now();
          record(memKey, end - start);

          return result;
        }
      }
      return originalFunction.apply(this, args);
    };
  }
}

export function ClassProfiler(option?: ClassProfilerAnnotationOption) {
  return (target: any) => {
    if (!window.appConfig.VUE_APP_PROFILER_ENABLED) {
      return;
    }
    const ctor = target as any;
    if (!ctor.prototype) {
      return;
    }

    const className = ctor.prototype.constructor.name;
    Reflect.ownKeys(ctor.prototype).forEach(k => {
      wrapClass(ctor.prototype, k, className, option);
    });
  };
}

export function MethodProfiler(option?: MethodProfilerAnnotationOption) {
  return (target: any, key: string | symbol, descriptor: TypedPropertyDescriptor<any>) => {
    if (!window.appConfig.VUE_APP_PROFILER_ENABLED) {
      return;
    }
    if (key && descriptor) {
      wrapMethod(target, key, descriptor, option);
      return;
    }
  };
}
