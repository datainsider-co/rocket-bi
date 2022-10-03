import { Licence, OrganizationPermissionRepository, Usage, UsageClassName } from '@core/organization';
import { Inject } from 'typescript-ioc';

export abstract class OrganizationPermissionService {
  abstract isAllow(...usages: Usage[]): Promise<Map<UsageClassName, boolean>>;

  abstract isAllowAll(...usages: Usage[]): Promise<boolean>;

  abstract getLicence(licenceKey: string): Promise<Licence>;
}

export class OrganizationPermissionServiceImpl extends OrganizationPermissionService {
  constructor(@Inject private repository: OrganizationPermissionRepository) {
    super();
  }

  async isAllow(...usages: Usage[]): Promise<Map<UsageClassName, boolean>> {
    const isAllows = await this.repository.isAllow(...usages);
    const usageAsMap = new Map<UsageClassName, boolean>();
    usages.forEach((usage, index) => {
      usageAsMap.set(usage.className, isAllows[index] ?? false);
    });
    return usageAsMap;
  }

  isAllowAll(...usages: Usage[]): Promise<boolean> {
    return this.repository.isAllowAll(...usages);
  }

  getLicence(licenceKey: string): Promise<Licence> {
    return this.repository.getLicence(licenceKey);
  }
}

export class MockOrganizationPermissionService extends OrganizationPermissionService {
  async isAllow(...usages: Usage[]): Promise<Map<UsageClassName, boolean>> {
    return new Map([
      [UsageClassName.ClickhouseConfigUsage, true],
      [UsageClassName.DataRelationshipUsage, true]
    ]);
  }

  isAllowAll(...usages: Usage[]): Promise<boolean> {
    return this.isAllow(...usages).then(usageAsMap => {
      return Array.from(usageAsMap.values()).every(value => value);
    });
  }

  async getLicence(licenceKey: string): Promise<Licence> {
    return Licence.community();
  }
}
