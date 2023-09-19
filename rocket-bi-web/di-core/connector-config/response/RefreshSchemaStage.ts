import { RefreshSchemaStageName, StageStatus } from '@core/connector-config';

export class RefreshSchemaStage {
  constructor(
    public name: RefreshSchemaStageName,
    public progress: number,
    public total: number,
    public status: StageStatus,
    public message: string,
    public createdTime: number
  ) {}

  static fromObject(obj: RefreshSchemaStage) {
    return new RefreshSchemaStage(obj.name, obj.progress, obj.total, obj.status, obj.message, obj.createdTime);
  }

  setStatus(status: StageStatus) {
    this.status = status;
  }

  get isScanDatabaseStage() {
    return this.name === RefreshSchemaStageName.ScanDatabase;
  }

  get isRunning(): boolean {
    return StageStatus.Running === this.status;
  }

  get isError(): boolean {
    return StageStatus.Error === this.status;
  }

  get isSuccess(): boolean {
    return StageStatus.Success === this.status;
  }

  get isTerminated(): boolean {
    return StageStatus.Terminated === this.status;
  }

  static default(name: RefreshSchemaStageName) {
    return new RefreshSchemaStage(name, 0, -1, StageStatus.Running, '', 0);
  }
}
