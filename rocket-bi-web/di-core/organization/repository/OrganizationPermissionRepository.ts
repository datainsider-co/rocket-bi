import { Licence, Usage } from '@core/organization';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';

export abstract class OrganizationPermissionRepository {
  abstract isAllow(...usages: Usage[]): Promise<boolean[]>;

  abstract isAllowAll(...usages: Usage[]): Promise<boolean>;

  abstract getLicence(licenceKey: string): Promise<Licence>;
}

export class OrganizationPermissionRepositoryImpl extends OrganizationPermissionRepository {
  @InjectValue(DIKeys.CaasClient)
  private httpClient!: BaseClient;

  isAllow(...usages: Usage[]): Promise<boolean[]> {
    return this.httpClient.post<boolean[]>('/organization/allow', usages);
  }

  isAllowAll(...usages: Usage[]): Promise<boolean> {
    return this.httpClient.post('/organization/allow_all', usages).then((response: any) => response.isAllow);
  }

  getLicence(licenceKey: string): Promise<Licence> {
    return this.httpClient.get('/', { licenceKey: licenceKey }).then((response: any) => Licence.fromObject(response));
  }
}
