import { EtlOperator } from './EtlOperator';
import { TimeScheduler } from '@/screens/DataIngestion/components/JobSchedulerForm/SchedulerTime/TimeScheduler';
import { SchedulerName } from '@/shared/enums/SchedulerName';
import { StringUtils } from '@/utils/string.utils';
import { Config, EtlConfig, IncrementalConfig } from '@core/DataCook';

export class Position {
  constructor(public top: string, public left: string) {}

  static fromXY(x: number, y: number) {
    return new Position(StringUtils.toPx(y), StringUtils.toPx(x));
  }

  static fromTopLeft(top: number, left: number) {
    return new Position(StringUtils.toPx(top), StringUtils.toPx(left));
  }
}

export class PositionValue {
  constructor(public x: number, public y: number) {}

  static fromObject(obj: PositionValue | undefined): PositionValue {
    return new PositionValue(obj?.x ?? 0, obj?.y ?? 0);
  }
}

export class EtlExtraData {
  constructor(
    public renderOptions: Record<string, any>,
    public tablePosition: Record<string, Position>,
    public operatorPosition: Record<string, Position>,
    public savedTablePosition: Record<string, Position>,
    public savedEmailConfigPosition: Record<string, Position>,
    public savedThirdPartyPosition: Record<string, Position>,
    public stagePosition: PositionValue
  ) {}

  static fromObject(obj: EtlExtraData | undefined) {
    return new EtlExtraData(
      obj?.renderOptions ?? {},
      obj?.tablePosition ?? {},
      obj?.operatorPosition ?? {},
      obj?.savedTablePosition ?? {},
      obj?.savedEmailConfigPosition ?? {},
      obj?.savedThirdPartyPosition ?? {},
      PositionValue.fromObject(obj?.stagePosition)
    );
  }
}

export enum EtlJobStatus {
  Initialized = 'Initialized',
  Error = 'Error',
  Queued = 'Queued',
  /**
   * @deprecated remove
   */
  Synced = 'Synced',
  /**
   * @deprecated remove
   */
  Syncing = 'Syncing',
  Running = 'Running',
  Done = 'Done',

  Terminated = 'Terminated',
  Unknown = 'Unknown'
}

export class EtlJobInfo {
  constructor(
    public id: number,
    public displayName: string,
    public operators: EtlOperator[],
    public ownerId: string,
    public scheduleTime: TimeScheduler,
    public createdTime: number,
    public updatedTime: number,
    public nextExecuteTime: number,
    public lastExecuteTime: number,
    public status: EtlJobStatus,
    public owner: OwnerInfo,
    public lastHistoryId: string,
    public config: EtlConfig,
    public extraData?: EtlExtraData
  ) {}

  static fromObject(obj: any) {
    return new EtlJobInfo(
      obj.id,
      obj.displayName,
      obj.operators.map(EtlOperator.fromObject),
      obj.ownerId,
      TimeScheduler.fromObject(obj.scheduleTime),
      // obj.scheduleTime,
      obj.createdTime,
      obj.updatedTime,
      obj.nextExecuteTime,
      obj.lastExecuteTime,
      obj.status,
      obj.owner,
      obj.lastHistoryId,
      obj?.config ? EtlConfig.fromObject(obj.config) : new EtlConfig(new Map<string, Config>()),
      EtlExtraData.fromObject(obj.extraData)
    );
  }

  get canCancel(): boolean {
    switch (this.status) {
      case EtlJobStatus.Queued:
      case EtlJobStatus.Syncing:
      case EtlJobStatus.Running:
        return true;
      default:
        return false;
    }
  }

  get wasRun() {
    return this.updatedTime > 0;
  }

  get hasNextRunTime() {
    if (this.scheduleTime.className === SchedulerName.Once) {
      switch (this.status) {
        case EtlJobStatus.Initialized:
        case EtlJobStatus.Queued:
          return true;
        default:
          return false;
      }
    } else if (this.scheduleTime.className === SchedulerName.None) {
      return false;
    } else {
      return true;
    }
  }

  get lastRunStatusIcon() {
    return EtlJobInfo.getIconFromStatus(this.status);
  }

  static getIconFromStatus(status: EtlJobStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (status) {
      case EtlJobStatus.Error:
        return require(`@/${baseUrl}/error.svg`);
      case EtlJobStatus.Initialized:
        return require(`@/${baseUrl}/initialized.svg`);
      case EtlJobStatus.Queued:
        return require(`@/${baseUrl}/queued.svg`);
      case EtlJobStatus.Synced:
      case EtlJobStatus.Done:
        return require(`@/${baseUrl}/synced.svg`);
      case EtlJobStatus.Syncing:
      case EtlJobStatus.Running:
        return require(`@/${baseUrl}/syncing.svg`);

      case EtlJobStatus.Terminated:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }
}

export class OwnerInfo {
  constructor(
    public username: string,
    public fullName: string,
    public lastName: string,
    public firstName: string,
    public gender: number,
    public avatar: string
  ) {}
}
