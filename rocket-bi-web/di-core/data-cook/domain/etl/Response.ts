import { EtlJobData, ErrorPreviewETLData } from '@core/data-cook/domain/etl/EtlJobData';
import { JobStatus } from '@core/data-ingestion';
import { TableSchema } from '@core/common/domain';

export class PreviewEtlOperatorResponse {
  constructor(public progressId: number) {}

  static fromObject(obj: PreviewEtlOperatorResponse) {
    return new PreviewEtlOperatorResponse(obj.progressId);
  }
}

export class CheckProgressResponse {
  constructor(public id: number, public status: JobStatus, public data: EtlJobData | null, public error: ErrorPreviewETLData | null) {}

  get loading() {
    return [JobStatus.Queued, JobStatus.Syncing, JobStatus.Initialized].includes(this.status);
  }

  get isError() {
    return this.status === JobStatus.Error;
  }

  static success(data: EtlJobData): CheckProgressResponse {
    return new CheckProgressResponse(0, JobStatus.Synced, data, null);
  }

  static error(error: ErrorPreviewETLData): CheckProgressResponse {
    return new CheckProgressResponse(0, JobStatus.Error, null, error);
  }

  static fromObject(obj: CheckProgressResponse) {
    return new CheckProgressResponse(
      obj.id,
      obj.status,
      obj.data ? EtlJobData.fromObject(obj.data) : null,
      obj.error ? ErrorPreviewETLData.fromObject(obj.error) : null
    );
  }
}

export class PreviewETLData {
  constructor(public allTableSchemas: TableSchema[]) {}

  static fromObject(obj: PreviewETLData) {
    return new PreviewETLData(obj.allTableSchemas.map(item => TableSchema.fromObject(item)));
  }
}

export class PreviewEtlResponse {
  constructor(public id: number, public status: JobStatus, public data: PreviewETLData | null, public errors: ErrorPreviewETLData[] = []) {}

  get loading() {
    return [JobStatus.Queued, JobStatus.Syncing, JobStatus.Initialized].includes(this.status);
  }

  get isError() {
    return this.status === JobStatus.Error;
  }

  static fromObject(obj: PreviewEtlResponse): PreviewEtlResponse {
    const errors: ErrorPreviewETLData[] = obj.errors ? obj.errors.map(error => ErrorPreviewETLData.fromObject(error)) : [];
    return new PreviewEtlResponse(obj.id, obj.status, obj.data ? PreviewETLData.fromObject(obj.data) : null, errors);
  }
}

export class EtlDatabaseNameResponse {
  constructor(public id: number, public databaseName: string) {}

  static fromObject(obj: EtlDatabaseNameResponse) {
    return new EtlDatabaseNameResponse(obj.id, obj.databaseName);
  }
}

export class ParseQueryResponse {
  constructor(public id: number, public query: string) {}

  static fromObject(obj: ParseQueryResponse) {
    return new ParseQueryResponse(obj.id, obj.query);
  }
}
