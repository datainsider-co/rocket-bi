import { BulkIngestRequest } from '@core/common/domain/request';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules/Di';
import { BaseClient } from '@core/common/services/HttpClient';
import { IngestResponse } from '@core/common/domain/response';

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
