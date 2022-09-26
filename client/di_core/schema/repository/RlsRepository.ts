import { PageResult, PolicyId, RlsPolicy, UserAttribute } from '@core/domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/modules';
import { BaseClient } from '@core/services';
import { UpdateRLSPolicyRequest } from '@core/domain/Model/Schema/Rls/UpdateRLSPolicyRequest';

export abstract class RlsRepository {
  abstract listPolicies(dbName?: string, tblName?: string): Promise<PageResult<RlsPolicy>>;

  abstract updatePolicy(request: UpdateRLSPolicyRequest): Promise<PageResult<RlsPolicy>>;

  abstract suggestAttributes(): Promise<UserAttribute[]>;
}

export class RlsRepositoryIml extends RlsRepository {
  @InjectValue(DIKeys.authClient)
  private httpClient!: BaseClient;

  listPolicies(dbName?: string, tblName?: string): Promise<PageResult<RlsPolicy>> {
    return this.httpClient
      .post<PageResult<RlsPolicy>>(`/policies/list`, { dbName: dbName, tblName: tblName })
      .then(response => {
        const policies = response.data.map(policy => RlsPolicy.fromObject(policy));
        return new PageResult<RlsPolicy>(policies, response.total);
      });
  }

  suggestAttributes(): Promise<UserAttribute[]> {
    return Promise.resolve([]);
  }

  updatePolicy(request: UpdateRLSPolicyRequest): Promise<PageResult<RlsPolicy>> {
    return this.httpClient.put<PageResult<RlsPolicy>>(`/policies`, request).then(response => {
      const policies = response.data.map(policy => RlsPolicy.fromObject(policy));
      return new PageResult<RlsPolicy>(policies, response.total);
    });
  }
}
