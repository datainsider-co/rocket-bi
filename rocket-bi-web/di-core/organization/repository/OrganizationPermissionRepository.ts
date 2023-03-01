import { Licence, Usage } from '@core/organization';
import { InjectValue } from 'typescript-ioc';
import { Di, DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { DataManager } from '@core/common/services';
import { StringUtils } from '@/utils';
import { DIException } from '@core/common/domain';

export abstract class OrganizationPermissionRepository {
  abstract isAllow(...usages: Usage[]): Promise<boolean[]>;

  abstract isAllowAll(...usages: Usage[]): Promise<boolean>;

  abstract getLicence(licenceKey: string): Promise<Licence>;
}

export class OrganizationPermissionRepositoryImpl extends OrganizationPermissionRepository {
  @InjectValue(DIKeys.BillingClient)
  private httpClient!: BaseClient;

  private licenseKey = Di.get(DataManager).getUserInfo()?.organization.licenceKey ?? '';

  isAllow(...usages: Usage[]): Promise<boolean[]> {
    if (StringUtils.isEmpty(this.licenseKey)) {
      throw new DIException('not found license key');
    }
    return this.httpClient.post<boolean[]>(`/billing/licenses/${this.licenseKey}/verify`, { usages });
  }

  isAllowAll(...usages: Usage[]): Promise<boolean> {
    return this.httpClient.post('/organization/allow_all', usages).then((response: any) => response.isAllow);
  }

  getLicence(licenceKey: string): Promise<Licence> {
    return this.httpClient.get('/', { licenceKey: licenceKey }).then((response: any) => Licence.fromObject(response));
  }
}
