import { RefreshSchemaStage, StageStatus } from '@core/connector-config';

export class RefreshSchemaHistory {
  constructor(
    public stages: RefreshSchemaStage[],
    public status: StageStatus,
    public isFirstRun: boolean,
    public createdTime: number,
    public updatedTime: number
  ) {}

  static fromObject(obj: RefreshSchemaHistory) {
    const stages: RefreshSchemaStage[] = obj.stages.map(stage => RefreshSchemaStage.fromObject(stage));
    return new RefreshSchemaHistory(stages, obj.status, obj.isFirstRun, obj.createdTime, obj.updatedTime);
  }

  static default() {
    return new RefreshSchemaHistory([], StageStatus.NotStarted, false, 0, 0);
  }

  get isError() {
    return this.status === StageStatus.Error;
  }

  get isTerminated() {
    return this.status === StageStatus.Terminated;
  }

  get isNotStarted() {
    return this.status === StageStatus.NotStarted;
  }

  get isRunning() {
    return this.status === StageStatus.Running;
  }

  static getColorFromStatus(status: StageStatus): string {
    switch (status) {
      case StageStatus.NotStarted:
        return '#ffc14e';
      case StageStatus.Success:
        return '#07BC40';
      case StageStatus.Running:
        return '#4e8aff';
      case StageStatus.Error:
        return '#EA6B6B';
      default:
        return 'var(--secondary-text-color)';
    }
  }

  static getStatusDisplayName(status: StageStatus) {
    switch (status) {
      case StageStatus.NotStarted:
        return 'Not Started';
      case StageStatus.Success:
        return 'Synced';
      case StageStatus.Running:
        return 'Running';
      case StageStatus.Error:
        return 'Error';
      default:
        return 'Unknown';
    }
  }

  static getStatusIcon(status: StageStatus) {
    const baseUrl = 'assets/icon/data_ingestion/status';
    switch (status) {
      case StageStatus.Error:
        return require(`@/${baseUrl}/error.svg`);
      case StageStatus.NotStarted:
        return require(`@/${baseUrl}/initialized.svg`);
      // case StageStatus.Queued:
      //   return require(`@/${baseUrl}/queued.svg`);
      case StageStatus.Success:
        return require(`@/${baseUrl}/synced.svg`);
      case StageStatus.Running:
        return require(`@/${baseUrl}/syncing.svg`);
      case StageStatus.Terminated:
        return require(`@/${baseUrl}/terminated.svg`);
      default:
        return require(`@/${baseUrl}/unknown.svg`);
    }
  }
}
