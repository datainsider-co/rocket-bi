import { outputProfilerData } from '@/shared/profiler/annotation';

export interface ProfilerAnnotationOption {
  getIncluded?: boolean;
  setIncluded?: boolean;
}

export interface ClassProfilerAnnotationOption extends ProfilerAnnotationOption {
  prefix?: string;
}

export interface MethodProfilerAnnotationOption {
  prefix?: string;
  name?: string;
}

export interface ProfilerData {
  calls: number;
  time: number;
  lastTime: number;
  minTime?: number;
  maxTime?: number;
}

export interface ProfileOutputData {
  name: string;
  calls: number;
  lastCpuTime: number;
  minCpuTime: number;
  maxCpuTime: number;
  cpuTimePerCall: number;
  callsPerSecond: number;
  cpuTimePerSecond: number;
}

export interface Memory {
  data: { [name: string]: ProfilerData };
  start?: number;
  total: number;
}

export abstract class Profiler {
  abstract getMemory(): Memory;

  abstract record(key: string | symbol, time: number): void;

  abstract getTotalTicks(): number;

  abstract getLastTotalTicks(): number;

  abstract isEnabled(): boolean;

  abstract clear(): string;

  abstract start(): string;

  abstract status(): string;

  abstract stop(): string;

  output() {
    const totalTicks = this.getTotalTicks();
    let totalCpu = 0;
    let result: Partial<ProfileOutputData>;
    const memory: Memory = this.getMemory();
    const data = Reflect.ownKeys(memory.data).map((key: any) => {
      const calls = memory.data[key].calls;
      const time = memory.data[key].time;

      result = {};
      result.name = `${key}`;
      result.calls = calls;
      result.lastCpuTime = memory.data[key].lastTime;
      result.minCpuTime = memory.data[key].minTime || 0;
      result.maxCpuTime = memory.data[key].maxTime || 0;
      result.cpuTimePerCall = time / calls;
      result.callsPerSecond = (calls * 1000) / totalTicks;
      result.cpuTimePerSecond = (time * 1000) / totalTicks;
      totalCpu += result.cpuTimePerSecond;
      return result as ProfileOutputData;
    });
    outputProfilerData(data, totalCpu, totalTicks);

    return 'Done';
  }

  toString() {
    return (
      'window.profiler.start() - Starts the profiler\n' +
      'window.profiler.stop() - Stops/Pauses the profiler\n' +
      'window.profiler.status() - Returns whether is profiler is currently running or not\n' +
      'window.profiler.output() - Pretty-prints the collected profiler data to the console\n' +
      'window.profiler.clear() - Clears the collected profiler data\n' +
      this.status()
    );
  }
}
