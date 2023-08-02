import { PlanDetail, PlanInfo } from '../domain';
import { Inject } from 'typescript-ioc';
import { OrganizationRepository } from '../repository';
import { Log } from '@core/utils';
import { UnsubscribePlanResp } from '@core/organization/domain/Plan/UnsubscribePlanResp';
import { PlanType } from '@core/organization/domain/Plan/PlanType';
import { SubscribePlanResp } from '@core/organization/domain/Plan/SubscribePlanResp';
import { Organization } from '@core/common/domain';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';
import { RegisterInfo } from '@core/organization';
import { ContactInfo } from '@/screens/organization-settings/components/ContactUsModal.vue';

export abstract class OrganizationService {
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

export class OrganizationServiceImpl extends OrganizationService {
  constructor(@Inject private organizationRepository: OrganizationRepository) {
    super();
    Log.info('OrganizationServiceImpl', organizationRepository);
  }

  getPlan(): Promise<PlanInfo> {
    return this.organizationRepository.getPlan();
  }

  getPlanDetail(): Promise<PlanDetail> {
    return this.organizationRepository.getPlanDetail();
  }

  subscribePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.organizationRepository.subscribePlan(planType);
  }

  revisePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.organizationRepository.revisePlan(planType);
  }

  unsubscribePlan(): Promise<UnsubscribePlanResp> {
    return this.organizationRepository.unsubscribePlan();
  }

  getOrganization(): Promise<Organization> {
    return this.organizationRepository.getOrganization();
  }

  updateOrganization(request: UpdateOrganizationRequest): Promise<Organization> {
    return this.organizationRepository.updateOrganization(request);
  }

  register(registerInfo: RegisterInfo): Promise<Organization> {
    return this.organizationRepository.register(registerInfo);
  }

  checkExistedSubDomain(subDomain: string): Promise<boolean> {
    return this.organizationRepository.checkExistedSubDomain(subDomain);
  }

  contactUs(contactInfo: ContactInfo): Promise<void> {
    return this.organizationRepository.contactUs(contactInfo);
  }

  refreshLicense(): Promise<void> {
    return this.organizationRepository.refreshLicense();
  }
}
