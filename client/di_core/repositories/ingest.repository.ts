import { BulkIngestRequest } from '@core/domain/Request';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules/di';
import { BaseClient } from '@core/services/base.service';
import { IngestResponse } from '@core/domain/Response';

abstract class IngestRepository {
  abstract bulkIngest(request: BulkIngestRequest): Promise<IngestResponse>;
}

class HttpIngestRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;
  private apiPath = '/log';

  bulkIngest(request: BulkIngestRequest): Promise<IngestResponse> {
    return this.httpClient.post<IngestResponse>(`${this.apiPath}`, request);
  }
}

export { IngestRepository, HttpIngestRepository };
