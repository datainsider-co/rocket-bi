import { ApiKeyInfo } from '@core/organization';

export class ApiKeyResponse {
  constructor(public apiKeyInfo: ApiKeyInfo, public permissions: string[]) {}

  static fromObject(obj: ApiKeyResponse) {
    return new ApiKeyResponse(
      ApiKeyInfo.fromObject(obj.apiKeyInfo),
      obj.permissions.map(per => per.replace(new RegExp('[0-9]+\\:'), ''))
    );
  }

  static default() {
    return new ApiKeyResponse(ApiKeyInfo.default(), []);
  }
}
