import { JobId, SourceId } from '@core/common/domain';

export class JobUpdationRequest {
  id: JobId;
  sourceId: SourceId;
  lastSuccessfulSync: number;
  syncIntervalInMn: number;
  constructor(id: JobId, sourceId: SourceId, lastSuccessfulSync: number, syncIntervalInMn: number) {
    this.id = id;
    this.sourceId = sourceId;
    this.lastSuccessfulSync = lastSuccessfulSync;
    this.syncIntervalInMn = syncIntervalInMn;
  }
}
