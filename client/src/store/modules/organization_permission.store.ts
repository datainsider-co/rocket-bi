/* eslint-disable @typescript-eslint/no-use-before-define */
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Stores } from '@/shared';

import { CdpUsage, LakeUsage, Licence, OrganizationPermissionService, PermissionClassName, Usage, UsageClassName } from '@core/Organization';
import { Log } from '@core/utils';
import { DI } from '@core/modules';

@Module({ store, name: Stores.OrganizationPermission, dynamic: true, namespaced: true })
export class OrganizationPermissionStore extends VuexModule {
  private licence: Licence = Licence.community();
  private usageAllowedAsMap: Map<string, boolean> = new Map();

  private listRequiredUsages: Usage[] = [];

  get isEnabledCDP(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.CdpUsage) ?? false;
  }

  get isEnabledLake(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.LakeUsage) ?? false;
  }

  get isEnabledIngestion(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.IngestionUsage) ?? false;
  }

  get isEnabledStreaming(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.StreamingUsage) ?? false;
  }

  get isEnabledUserActivity(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.UserActivityUsage) ?? false;
  }

  get isEnabledBilling(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.BillingUsage) ?? false;
  }

  get isEnabledClickhouseConfig(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.ClickhouseConfigUsage) ?? false;
  }

  get isEnabledDataCook(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.DataCookUsage) ?? false;
  }

  get isEnabledUserManagement(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.UserManagementUsage) ?? false;
  }

  get isEnabledApiKey(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.ApiKeyUsage) ?? false;
  }

  get isEnableDataRelationship(): boolean {
    return this.usageAllowedAsMap.get(UsageClassName.DataRelationshipUsage) ?? false;
  }

  @Mutation
  protected setLicence(licence: Licence) {
    this.licence = licence;
  }

  @Mutation
  protected setUsageAllowed(usageAllowedAsMap: Map<UsageClassName, boolean>) {
    this.usageAllowedAsMap = usageAllowedAsMap;
  }

  @Action
  async init() {
    try {
      const usageAllowedAsMap: Map<UsageClassName, boolean> = await DI.get(OrganizationPermissionService).isAllow(...this.listRequiredUsages);
      this.setUsageAllowed(usageAllowedAsMap);
    } catch (ex) {
      Log.error('OrganizationPermissionStore::init', ex);
    }
  }
}

const OrganizationPermissionModule = getModule(OrganizationPermissionStore, store);
export default OrganizationPermissionModule;
