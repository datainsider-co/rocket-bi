export abstract class PermissionProvider {
  protected buildPerm(organizationId: string, domain: string, action?: string, resourceId?: string): string {
    return this.buildPermWithParts([organizationId, domain, action ?? '*', resourceId ?? '*']);
  }

  protected buildPermWithParts(parts: string[]): string {
    return parts.join(':');
  }
}
