import { PlanDetail, PlanInfo } from '../domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { UnsubscribePlanResp } from '@core/organization/domain/Plan/UnsubscribePlanResp';
import { JsonUtils, Log } from '@core/utils';
import { DIException, Organization } from '@core/common/domain';
import { SubscribePlanResp } from '@core/organization/domain/Plan/SubscribePlanResp';
import { PlanType } from '@core/organization/domain/Plan/PlanType';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';
import { RegisterInfo } from '@core/organization';
import { ContactInfo } from '@/screens/organization-settings/components/ContactUsModal.vue';

export abstract class OrganizationRepository {
  abstract getPlan(): Promise<PlanInfo>;
  abstract getPlanDetail(): Promise<PlanDetail>;
  abstract subscribePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract revisePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract unsubscribePlan(): Promise<UnsubscribePlanResp>;
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

  getPlan(): Promise<PlanInfo> {
    return this.billingClient
      .get<PlanInfo>('/billing/plan')
      .then(PlanInfo.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::getPlan::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  getPlanDetail(): Promise<PlanDetail> {
    return this.billingClient
      .get<PlanDetail>(`billing/licenses/a2befd3c-962a-11ed-9883-0242ac120024`)
      .then(PlanDetail.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::getPlanDetail::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  unsubscribePlan(): Promise<UnsubscribePlanResp> {
    return this.billingClient
      .put<UnsubscribePlanResp>(`/billing/payment/unsubscribe`)
      .then(UnsubscribePlanResp.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::unsubscribePlan::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  subscribePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.billingClient
      .post<SubscribePlanResp>(`/billing/payment/subscribe`, { planType })
      .then(SubscribePlanResp.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::subscribe::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  revisePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.billingClient
      .put<SubscribePlanResp>(`/billing/payment/revise`, { planType })
      .then(SubscribePlanResp.fromObject);
    // .catch(e => {
    //   debugger;
    //   Log.info(e);
    //   Log.error('OrganizationRepositoryImpl::revisePlan::exception::', e.message);
    //   throw new DIException(e.message);
    // });
  }

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
