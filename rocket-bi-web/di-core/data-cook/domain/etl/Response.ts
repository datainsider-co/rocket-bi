import { EtlJobData, EtlJobError } from '@core/data-cook/domain/etl/EtlJobData';
import { JobStatus } from '@core/data-ingestion';
import { TableSchema } from '@core/common/domain';

export class PreviewEtlOperatorResponse {
  constructor(public progressId: number) {}

  static fromObject(obj: PreviewEtlOperatorResponse) {
    return new PreviewEtlOperatorResponse(obj.progressId);
  }
}

export class CheckProgressResponse {
  constructor(public id: number, public status: JobStatus, public data: EtlJobData | null, public error: EtlJobError | null) {}

  get loading() {
    return [JobStatus.Queued, JobStatus.Syncing, JobStatus.Initialized].includes(this.status);
  }

  get isError() {
    return this.status === JobStatus.Error;
  }

  static fromObject(obj: CheckProgressResponse) {
    return new CheckProgressResponse(
      obj.id,
      obj.status,
      obj.data ? EtlJobData.fromObject(obj.data) : null,
      obj.error ? EtlJobError.fromObject(obj.error) : null
    );
  }
}

export class MultiPreviewEtlOperatorData {
  constructor(public allTableSchemas: TableSchema[]) {}

  static fromObject(obj: MultiPreviewEtlOperatorData) {
    return new MultiPreviewEtlOperatorData(obj.allTableSchemas.map(item => TableSchema.fromObject(item)));
  }
}

export class MultiPreviewEtlOperatorResponse {
  constructor(public id: number, public status: JobStatus, public data: MultiPreviewEtlOperatorData | null, public error: EtlJobError | null) {}

  get loading() {
    return [JobStatus.Queued, JobStatus.Syncing, JobStatus.Initialized].includes(this.status);
  }

  get isError() {
    return this.status === JobStatus.Error;
  }

  static fromObject(obj: MultiPreviewEtlOperatorResponse) {
    return new MultiPreviewEtlOperatorResponse(
      obj.id,
      obj.status,
      obj.data ? MultiPreviewEtlOperatorData.fromObject(obj.data) : null,
      obj.error ? EtlJobError.fromObject(obj.error) : null
    );
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
