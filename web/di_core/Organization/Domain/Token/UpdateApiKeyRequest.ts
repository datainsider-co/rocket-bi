export class UpdateApiKeyRequest {
  constructor(
    public apiKey: string,
    public displayName: string,
    public expiredTimeMs: number,
    public includePermissions: string[],
    public excludePermissions: string[]
  ) {}
}
