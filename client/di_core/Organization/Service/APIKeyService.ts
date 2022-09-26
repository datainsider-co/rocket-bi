import { ApiKeyInfo, ApiKeyResponse, CreateApiKeyRequest, UpdateApiKeyRequest } from '../Domain';
import { Inject } from 'typescript-ioc';
import { APIKeyRepository } from '../Repository';
import { Log } from '@core/utils';
import { ListingRequest } from '@core/LakeHouse/Domain/Request/ListingRequest/ListingRequest';
import { PageResult } from '@core/domain';

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
