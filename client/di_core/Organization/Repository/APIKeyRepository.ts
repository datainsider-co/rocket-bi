import { ApiKeyInfo, ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '../Domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services/base.service';
import { PageResult } from '@core/domain';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { BaseResponse } from '@core/DataIngestion/Domain/Response/BaseResponse';

export abstract class APIKeyRepository {
  abstract get(apiKey: string): Promise<ApiKeyResponse>;
  abstract list(request: ListingRequest): Promise<PageResult<ApiKeyInfo>>;
  abstract create(request: CreateApiKeyRequest): Promise<ApiKeyResponse>;
  abstract update(request: UpdateApiKeyRequest): Promise<boolean>;
  abstract delete(apiKey: string): Promise<boolean>;
}

export class APIKeyRepositoryImpl extends APIKeyRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;

  create(request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    return this.httpClient.post<ApiKeyResponse>(`apikey`, request).then(res => ApiKeyResponse.fromObject(res));
  }

  list(request: ListingRequest): Promise<PageResult<ApiKeyInfo>> {
    return this.httpClient.post<PageResult<ApiKeyInfo>>(`apikey/list`, request).then(res => {
      const tokens = res.data.map(token => ApiKeyInfo.fromObject(token));
      return new PageResult(tokens, res.total);
    });
  }

  update(request: UpdateApiKeyRequest): Promise<boolean> {
    return this.httpClient.put<BaseResponse>(`apikey/${request.apiKey}`, request).then(res => res.success);
  }

  get(apiKey: string): Promise<ApiKeyResponse> {
    return this.httpClient.get<ApiKeyResponse>(`apikey/${apiKey}`).then(res => ApiKeyResponse.fromObject(res));
  }

  delete(apiKey: string): Promise<boolean> {
    return this.httpClient.delete<BaseResponse>(`apikey/${apiKey}`).then(res => res.success);
  }
}
