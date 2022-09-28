import { SourceId } from '@core/domain';

export abstract class JobCreationRequest {
  dataSourceId: SourceId;
  syncIntervalInMn: number;
  constructor(dataSourceId: SourceId, syncIntervalInMn: number) {
    this.dataSourceId = dataSourceId;
    this.syncIntervalInMn = syncIntervalInMn;
  }
}

export class JdbcJobCreationRequest extends JobCreationRequest {
  dataSourceId: SourceId;
  databaseName: string;
  tableName: string;
  beginValue: string;
  maxFetch: number;
  syncIntervalInMn: number;
  incrementalColumn?: string;
  constructor(
    dataSourceId: SourceId,
    databaseName: string,
    tableName: string,
    beginValue: string,
    maxFetch: number,
    syncIntervalInMn: number,
    incrementalColumn?: string
  ) {
    super(dataSourceId, syncIntervalInMn);
    this.dataSourceId = dataSourceId;
    this.databaseName = databaseName;
    this.tableName = tableName;
    this.incrementalColumn = incrementalColumn;
    this.beginValue = beginValue;
    this.maxFetch = maxFetch;
    this.syncIntervalInMn = syncIntervalInMn;
  }
}
