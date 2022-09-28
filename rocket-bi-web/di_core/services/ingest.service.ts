import { BulkIngestRequest } from '@core/domain/Request';
import { Inject } from 'typescript-ioc';
import { IngestRepository } from '@core/repositories/ingest.repository';
import { IngestResponse } from '@core/domain/Response';

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
