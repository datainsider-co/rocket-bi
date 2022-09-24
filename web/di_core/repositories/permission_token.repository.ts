import { PermissionTokenResponse } from '@core/domain/Response';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient, HttpClient } from '@core/services/base.service';
import { CheckTokenActionPermittedRequest } from '@core/domain/Request/ShareRequest';

export abstract class PermissionTokenRepository {
  abstract getTokenInfo(tokenId: string): Promise<PermissionTokenResponse>;

  abstract createToken(): Promise<PermissionTokenResponse>;

  abstract updateToken(tokenId: string, permissions: string[]): Promise<boolean>;

  abstract deleteToken(tokenId: string): Promise<boolean>;

  abstract isPermitted(tokenId: string, permissions: string[]): Promise<boolean[]>;

  abstract isPermittedAll(tokenId: string, permissions: string[]): Promise<boolean>;

  abstract isPermittedForToken(request: CheckTokenActionPermittedRequest): Promise<Map<string, boolean>>;
}

export class HttpPermissionToken extends PermissionTokenRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;
  private apiPath = '/permission_tokens';

  getTokenInfo(tokenId: string): Promise<PermissionTokenResponse> {
    return this.httpClient.get<PermissionTokenResponse>(`${this.apiPath}/${tokenId}`);
  }

  createToken(): Promise<PermissionTokenResponse> {
    return this.httpClient.post<PermissionTokenResponse>(`${this.apiPath}`);
  }

  updateToken(tokenId: string, permissions: string[]): Promise<boolean> {
    return this.httpClient.put(`${this.apiPath}/${tokenId}`, { permissions: permissions }).then(() => true);
  }

  deleteToken(tokenId: string): Promise<boolean> {
    return this.httpClient.delete(`${this.apiPath}/${tokenId}`).then(() => true);
  }

  isPermitted(tokenId: string, permissions: string[]): Promise<boolean[]> {
    return this.httpClient.post(`${this.apiPath}/${tokenId}/permitted`, {
      tokenId: tokenId,
      permissions: permissions
    });
  }

  isPermittedAll(tokenId: string, permissions: string[]): Promise<boolean> {
    return this.httpClient.post(`${this.apiPath}/${tokenId}/permitted_all`, { permissions: permissions }).then(() => true);
  }

  isPermittedForToken(request: CheckTokenActionPermittedRequest): Promise<Map<string, boolean>> {
    return this.httpClient
      .post(`${this.apiPath}/${request.tokenId}/action_permitted`, request, void 0, void 0, require('@/workers').DIWorkers.parsePureJson)
      .then(resp => new Map(Object.entries(resp as any)));
  }
}
