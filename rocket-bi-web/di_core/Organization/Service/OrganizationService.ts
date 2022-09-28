import { PlanDetail, PlanInfo } from '../Domain';
import { Inject } from 'typescript-ioc';
import { OrganizationRepository } from '../Repository';
import { Log } from '@core/utils';
import { UnsubscribePlanResp } from '@core/Organization/Domain/Plan/UnsubscribePlanResp';
import { PlanType } from '@core/Organization/Domain/Plan/PlanType';
import { SubscribePlanResp } from '@core/Organization/Domain/Plan/SubscribePlanResp';

export abstract class OrganizationService {
  abstract getPlan(): Promise<PlanInfo>;

  abstract getPlanDetail(): Promise<PlanDetail>;

  abstract subscribePlan(planType: PlanType): Promise<SubscribePlanResp>;

  abstract revisePlan(planType: PlanType): Promise<SubscribePlanResp>;

  abstract unsubscribePlan(): Promise<UnsubscribePlanResp>;
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
}
