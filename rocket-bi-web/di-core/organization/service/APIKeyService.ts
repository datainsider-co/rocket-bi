import { ApiKeyInfo, ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '../domain';
import { Inject } from 'typescript-ioc';
import { APIKeyRepository } from '../repository';
import { Log } from '@core/utils';
import { ListingRequest } from '@core/lake-house/domain/request/listing-request/ListingRequest';
import { PageResult } from '@core/common/domain';

export abstract class APIKeyService {
  abstract get(apiKey: string): Promise<ApiKeyResponse>;
  abstract list(request: ListingRequest): Promise<PageResult<ApiKeyInfo>>;
  abstract create(request: CreateApiKeyRequest): Promise<ApiKeyResponse>;
  abstract update(request: UpdateApiKeyRequest): Promise<boolean>;
  abstract delete(apiKey: string): Promise<boolean>;
}

export class APIKeyServiceImpl extends APIKeyService {
  constructor(@Inject private tokenRepository: APIKeyRepository) {
    super();
    Log.info('APIKeyServiceImpl', tokenRepository);
  }

  create(request: CreateApiKeyRequest): Promise<ApiKeyResponse> {
    return this.tokenRepository.create(request);
  }

  get(apiKey: string): Promise<ApiKeyResponse> {
    return this.tokenRepository.get(apiKey);
  }

  list(request: ListingRequest): Promise<PageResult<ApiKeyInfo>> {
    return this.tokenRepository.list(request);
  }

  update(request: UpdateApiKeyRequest): Promise<boolean> {
    return this.tokenRepository.update(request);
  }

  delete(apiKey: string): Promise<boolean> {
    return this.tokenRepository.delete(apiKey);
  }
}
