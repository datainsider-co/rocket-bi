import { Memory, Profiler } from '@/shared/profiler/Profiler';

export class InMemoryProfiler extends Profiler {
  memory: Memory;

  constructor() {
    super();

    this.memory = {
      data: {},
      total: 0
    } as Memory;
  }

  getMemory(): Memory {
    return this.memory;
  }

  isEnabled(): boolean {
    return this.memory.start ? true : false;
  }

  record(key: string, time: number): void {
    if (!this.memory.data[key]) {
      this.memory.data[key] = {
        calls: 0,
        time: 0,
        lastTime: 0
      };
    }
    this.memory.data[key].calls++;
    this.memory.data[key].time += time;
    this.memory.data[key].lastTime = time;
    if (!this.memory.data[key].minTime || time < (this.memory.data[key].minTime ?? 0)) {
      this.memory.data[key].minTime = time;
    }

    if (!this.memory.data[key].maxTime || time > (this.memory.data[key].maxTime ?? 0)) {
      this.memory.data[key].maxTime = time;
    }
  }

  getTotalTicks(): number {
    return this.memory.total + this.getLastTotalTicks();
  }

  getLastTotalTicks(): number {
    if (this.memory.start) {
      return Date.now() - this.memory.start;
    } else {
      return 0;
    }
  }

  clear() {
    const running = this.isEnabled();
    this.memory = {
      data: {},
      total: 0
    } as Memory;
    if (running) {
      this.memory.start = Date.now();
    }
    return 'Profiler Memory cleared';
  }

  status() {
    if (this.isEnabled()) {
      return 'Profiler is running';
    }
    return 'Profiler is stopped';
  }

  start() {
    this.memory.start = Date.now();
    return 'Profiler started';
  }

  stop() {
    if (this.isEnabled()) {
      const timeRunning = Date.now() - (this.getMemory().start || Date.now());
      this.memory.total += timeRunning;
      delete this.memory.start;
    }
    return 'Profiler stopped';
  }
}
