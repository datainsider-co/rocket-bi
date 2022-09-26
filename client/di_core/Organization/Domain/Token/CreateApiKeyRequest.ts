export class CreateApiKeyRequest {
  constructor(public displayName: string, public expiredTimeMs: number, public permissions: string[]) {}
}
