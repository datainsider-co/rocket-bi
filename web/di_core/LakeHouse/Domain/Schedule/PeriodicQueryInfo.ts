/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:34 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:29 PM
 */

import { NotifyInfo } from '../Query/NotifyInfo';
import { QueryOutputTemplate } from '../Query/QueryOutputTemplate';
import { Priority } from '../Query/NotebookInfo';
import moment from 'moment';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { DateTimeFormatter, DateUtils } from '@/utils';
import { toNumber } from 'lodash';
import { SchedulerWeekly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerWeekly';
import { SchedulerMonthly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMonthly';
import { SchedulerMinutely } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerMinutely';
import { SchedulerHourly } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerHourly';
import { SchedulerDaily } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerDaily';
import { SchedulerOnce } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/SchedulerOnce';

export enum PeriodicQueryStatus {
  ENABLED,
  DISABLED,
  RUNNING
}

export enum TimeUnit {
  SECOND = 1,
  MINUTE = 2,
  HOUR = 3,
  DAY = 4,
  WEEK = 5,
  MONTH = 6,
  YEAR = 7
}

export class PeriodicQueryInfo {
  static readonly DEFAULT_ID = '';
  id: string;
  name: string;
  query: string;
  ownerId: string;
  priority: Priority;
  status: PeriodicQueryStatus;
  resultPath: string;
  outputFields?: string[];
  notifyInfo: NotifyInfo[];
  createTime: number;
  outputs: QueryOutputTemplate[];
  intervalUnit?: TimeUnit;
  interval?: number;
  delayMills?: number;
  lastTimeExec: number;

  constructor(
    id: string,
    name: string,
    query: string,
    ownerId: string,
    priority: Priority,
    status: PeriodicQueryStatus,
    resultPath: string,
    outputFields: string[],
    notifyInfo: NotifyInfo[],
    createTime: number,
    outputs: QueryOutputTemplate[],
    intervalUnit: TimeUnit,
    interval: number,
    delayMills: number,
    lastTimeExec: number
  ) {
    this.id = id;
    this.name = name;
    this.query = query;
    this.ownerId = ownerId;
    this.priority = priority;
    this.status = status;
    this.resultPath = resultPath;
    this.outputFields = outputFields;
    this.notifyInfo = notifyInfo;
    this.createTime = createTime;
    this.outputs = outputs;
    this.intervalUnit = intervalUnit;
    this.interval = interval;
    this.delayMills = delayMills;
    this.lastTimeExec = lastTimeExec;
  }

  static fromObject(obj: any): PeriodicQueryInfo {
    const notifyInfo: NotifyInfo[] = (obj.notifyInfo ?? []).map((notify: any) => NotifyInfo.fromObject(notify));
    const outputs: QueryOutputTemplate[] = (obj.outputs ?? []).map((output: any) => QueryOutputTemplate.fromObject(output));
    return new PeriodicQueryInfo(
      obj.id,
      obj.name,
      obj.query,
      obj.ownerId,
      obj.priority,
      obj.status,
      obj.resultPath,
      obj.outputFields,
      notifyInfo,
      obj.createTime,
      outputs,
      obj.intervalUnit,
      obj.interval,
      obj.delayMills,
      obj.lastTimeExec
    );
  }

  static create(query: string): PeriodicQueryInfo {
    return new PeriodicQueryInfo(
      PeriodicQueryInfo.DEFAULT_ID,
      '',
      query,
      'root',
      Priority.Normal,
      PeriodicQueryStatus.ENABLED,
      '/',
      [],
      [],
      moment()
        .toDate()
        .getTime(),
      [],
      TimeUnit.DAY,
      1,
      0,
      -1
    );
  }

  get nextSync(): number {
    if (this.lastTimeExec === -1) {
      return this.createTime + this.runTime;
    } else {
      return this.lastTimeExec + this.runTime;
    }
  }

  get runTime(): number {
    const delayTimes = this.delayMills ?? 0;
    if (this.interval && this.intervalUnit) {
      const interval = this.interval;
      switch (this.intervalUnit) {
        case TimeUnit.SECOND:
          return interval * 1000 + delayTimes;
        case TimeUnit.MINUTE:
          return interval * 60000 + delayTimes;
        case TimeUnit.HOUR:
          return interval * 3600000 + delayTimes;
        case TimeUnit.DAY:
          return this.intervalUnit * 86400000 + delayTimes;
        case TimeUnit.WEEK:
          return this.intervalUnit * 604800000 + delayTimes;
        case TimeUnit.MONTH:
          return interval * 2629800000 + delayTimes;
        case TimeUnit.YEAR:
          return interval * 31556952000 + delayTimes;
      }
    } else {
      return delayTimes;
    }
  }

  updateInterval(scheduler: TimeScheduler) {
    const timeAsMS = DateUtils.HHMMSSToMs(DateTimeFormatter.formatAsHHmmss(moment(scheduler.atTime).toDate()));
    this.interval = toNumber(scheduler.recurEvery);
    switch (scheduler.className) {
      case SchedulerName.None:
        break;
      case SchedulerName.Once:
        this.delayMills = timeAsMS;
        break;
      case SchedulerName.Minutely:
        this.intervalUnit = TimeUnit.MINUTE;
        this.delayMills = 0;
        break;
      case SchedulerName.Hourly:
        this.intervalUnit = TimeUnit.HOUR;
        this.delayMills = 0;
        break;
      case SchedulerName.Daily:
        this.intervalUnit = TimeUnit.DAY;
        this.delayMills = timeAsMS;
        break;
      case SchedulerName.Weekly:
        this.intervalUnit = TimeUnit.WEEK;
        this.delayMills = DateUtils.calculateDelayTimesOfWeek((scheduler as SchedulerWeekly).includeDays[0], scheduler.atTime!);
        break;
      case SchedulerName.Monthly:
        this.intervalUnit = TimeUnit.MONTH;
        this.delayMills = DateUtils.calculateDelayTimesOfMonth((scheduler as SchedulerMonthly).recurOnDays[0], scheduler.atTime!);
        break;
    }
  }

  toScheduler(): TimeScheduler {
    switch (this.intervalUnit) {
      case TimeUnit.MINUTE:
        return new SchedulerMinutely(this.interval ?? 1);
      case TimeUnit.HOUR:
        return new SchedulerHourly(this.interval ?? 1);
      case TimeUnit.DAY:
        return new SchedulerDaily(this.interval ?? 1, DateUtils.covertTimeToDate(this.delayMills ?? 0));
      case TimeUnit.WEEK: {
        const dayOfWeekAsNumber = ((this.delayMills ?? 0 / 86400000) | 0) + 1;
        const day = DateUtils.numberToDate(dayOfWeekAsNumber);
        const time = dayOfWeekAsNumber * 86400000 - (this.delayMills ?? 0);
        return new SchedulerWeekly(this.interval ?? 1, DateUtils.covertTimeToDate(time), [day!]);
      }
      case TimeUnit.MONTH: {
        const totalDayDelays = ((this.delayMills ?? 0 / 86400000) | 0) + 1;
        const time = totalDayDelays * 86400000 - (this.delayMills ?? 0);
        return new SchedulerMonthly([totalDayDelays], DateUtils.covertTimeToDate(time), this.interval ?? 0);
      }
      default:
        return new SchedulerOnce(DateUtils.covertTimeToDate(this.delayMills ?? 0));
    }
  }

  get lastSync(): number {
    const isNotRun = this.lastTimeExec === -1;
    if (isNotRun) {
      return this.createTime;
    } else return this.lastTimeExec;
  }

  get isDisable(): boolean {
    switch (this.status) {
      case PeriodicQueryStatus.DISABLED:
        return true;
      case PeriodicQueryStatus.ENABLED:
      case PeriodicQueryStatus.RUNNING:
        return false;
    }
  }
}
