export enum FacebookTokenType {
  bearer = 'bearer'
}

export class TokenResponse {
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

  static fromObject(obj: any): TokenResponse {
    return new TokenResponse(obj.accessToken, obj.scope, obj.tokenType, obj.expiresIn, obj.refreshToken);
  }
}
