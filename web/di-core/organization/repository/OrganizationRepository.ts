import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { Organization } from '@core/common/domain';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';
import { RegisterInfo } from '@core/organization';
import { ContactInfo } from '@/screens/organization-settings/components/ContactUsModal.vue';

export abstract class OrganizationRepository {
  abstract getOrganization(): Promise<Organization>;
  abstract updateOrganization(request: UpdateOrganizationRequest): Promise<Organization>;
  abstract register(registerInfo: RegisterInfo): Promise<Organization>;
  abstract checkExistedSubDomain(subDomain: string): Promise<boolean>;
  abstract contactUs(contactInfo: ContactInfo): Promise<void>;
  abstract refreshLicense(): Promise<void>;
}

export class OrganizationRepositoryImpl extends OrganizationRepository {
  @InjectValue(DIKeys.BillingClient)
  private billingClient!: BaseClient;

  @InjectValue(DIKeys.CaasClient)
  private orgClient!: BaseClient;

  getOrganization(): Promise<Organization> {
    return this.orgClient.get('/organizations/my-domain').then(Organization.fromObject);
  }

  updateOrganization(request: UpdateOrganizationRequest): Promise<Organization> {
    return this.orgClient.put('/organizations', request).then(Organization.fromObject);
  }

  register(registerInfo: RegisterInfo): Promise<Organization> {
    return this.orgClient.post<Organization>(`/organizations`, registerInfo);
  }

  checkExistedSubDomain(subDomain: string): Promise<boolean> {
    return this.orgClient.get<{ existed: boolean }>(`/organizations/domain/check?sub_domain=${subDomain}`).then(res => res.existed);
  }

  contactUs(contactInfo: ContactInfo): Promise<void> {
    return this.orgClient.post(`/contact_us`, { ...contactInfo });
  }

  refreshLicense(): Promise<void> {
    return this.orgClient.get(`/license`);
  }
}
