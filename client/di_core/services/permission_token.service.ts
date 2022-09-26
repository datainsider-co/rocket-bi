import { PermissionTokenResponse } from '@core/domain/Response';
import { Inject } from 'typescript-ioc';
import { PermissionTokenRepository } from '@core/repositories/permission_token.repository';
import { CheckTokenActionPermittedRequest } from '@core/domain/Request/ShareRequest';

export abstract class PermissionTokenService {
  abstract getTokenInfo(tokenId: string): Promise<PermissionTokenResponse>;

  abstract createToken(): Promise<PermissionTokenResponse>;

  abstract updateToken(tokenId: string, permissions: string[]): Promise<boolean>;

  abstract deleteToken(tokenId: string): Promise<boolean>;

  abstract isPermitted(tokenId: string, permissions: string[]): Promise<Map<string, boolean>>;

  abstract isPermittedAll(tokenId: string, permissions: string[]): Promise<boolean>;

  abstract isPermittedForToken(request: CheckTokenActionPermittedRequest): Promise<Map<string, boolean>>;
}

export class PermissionTokenImpl extends PermissionTokenService {
  constructor(@Inject private permissionTokenRepository: PermissionTokenRepository) {
    super();
  }

  getTokenInfo(tokenId: string): Promise<PermissionTokenResponse> {
    return this.permissionTokenRepository.getTokenInfo(tokenId);
  }

  createToken(): Promise<PermissionTokenResponse> {
    return this.permissionTokenRepository.createToken();
  }

  updateToken(tokenId: string, permissions: string[]): Promise<boolean> {
    return this.permissionTokenRepository.updateToken(tokenId, permissions);
  }

  deleteToken(tokenId: string): Promise<boolean> {
    return this.permissionTokenRepository.deleteToken(tokenId);
  }

  isPermitted(tokenId: string, permissions: string[]): Promise<Map<string, boolean>> {
    return this.permissionTokenRepository.isPermitted(tokenId, permissions).then(listPermitted => {
      const permissionsAsMap = new Map<string, boolean>();
      permissions.forEach((permission, index) => {
        const permitted = listPermitted[index] || false;
        permissionsAsMap.set(permission, permitted);
      });
      return permissionsAsMap;
    });
  }

  isPermittedAll(tokenId: string, permissions: string[]): Promise<boolean> {
    return this.permissionTokenRepository.isPermittedAll(tokenId, permissions);
  }

  isPermittedForToken(request: CheckTokenActionPermittedRequest): Promise<Map<string, boolean>> {
    return this.permissionTokenRepository.isPermittedForToken(request);
  }
}
