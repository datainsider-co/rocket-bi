export enum FacebookTokenType {
  bearer = 'bearer'
}

export class FacebookTokenResponse {
  accessToken: string;
  scope: string | null;
  tokenType: FacebookTokenType;
  expiresIn: number;
  refreshToken: string | null;

  constructor(accessToken: string, scope: string | null, tokenType: FacebookTokenType, expiresIn: number, refreshToken: string | null) {
    this.accessToken = accessToken;
    this.scope = scope;
    this.tokenType = tokenType;
    this.expiresIn = expiresIn;
    this.refreshToken = refreshToken;
  }

  static fromObject(obj: any): FacebookTokenResponse {
    return new FacebookTokenResponse(obj.accessToken, obj.scope, obj.tokenType, obj.expiresIn, obj.refreshToken);
  }
}
