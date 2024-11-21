/* eslint-disable */
import { Action, getModule, Module, Mutation, VuexModule } from 'vuex-module-decorators';
import store from '@/store';
import { Organization } from '@core/common/domain';
import { Inject } from 'typescript-ioc';
import { DataManager } from '@core/common/services';
import { OrganizationService } from '@core/organization';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';
import { Log } from '@core/utils';
import { Di } from '@core/common/modules';
import { Stores } from '@/shared';

@Module({ store: store, name: Stores.OrganizationStore, namespaced: true, dynamic: true })
export class OrganizationStore extends VuexModule {
  public organization: Organization = Organization.default();

  @Inject
  private organizationService!: OrganizationService;

  get orgId() {
    return this.organization.organizationId;
  }

  @Action
  async init(): Promise<void> {
    try {
      const organization: Organization | null = DataManager.getOrganization();
      Log.debug('init', organization);
      if (organization && !organization.isExpiredCache()) {
        this.setOrganization(organization);
      } else {
        await OrganizationStoreModule.loadAndCacheOrganization();
      }
    } catch (e) {
      Log.error('init', e);
    }
  }

  @Action
  async loadAndCacheOrganization(): Promise<void> {
    const organization: Organization = await this.organizationService.getOrganization();
    this.setOrganization(organization);
    this.saveToCache(organization);
  }

  @Mutation
  setOrganization(organization: Organization): void {
    this.organization = organization;
  }

  @Mutation
  saveToCache(organization: Organization): void {
    DataManager.saveOrganization(organization);
  }

  @Action
  async update(request: UpdateOrganizationRequest): Promise<void> {
    await this.organizationService.updateOrganization(request);
  }
}

export const OrganizationStoreModule: OrganizationStore = getModule(OrganizationStore);
