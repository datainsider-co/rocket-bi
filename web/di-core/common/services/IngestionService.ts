import { BulkIngestRequest } from '@core/common/domain/request';
import { Inject } from 'typescript-ioc';
import { IngestRepository } from '@core/common/repositories/IngestRepository';
import { IngestResponse } from '@core/common/domain/response';

export abstract class IngestService {
  abstract bulkIngest(request: BulkIngestRequest): Promise<IngestResponse>;
}

export class IngestServiceImpl extends IngestService {
  constructor(@Inject private ingestRepository: IngestRepository) {
    super();
  }

  bulkIngest(request: BulkIngestRequest): Promise<IngestResponse> {
    return this.ingestRepository.bulkIngest(request);
  }
}
