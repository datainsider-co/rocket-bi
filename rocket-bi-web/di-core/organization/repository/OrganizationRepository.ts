import { PlanDetail, PlanInfo } from '../domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { UnsubscribePlanResp } from '@core/organization/domain/plan/UnsubscribePlanResp';
import { Log } from '@core/utils';
import { DIException } from '@core/common/domain';
import { SubscribePlanResp } from '@core/organization/domain/plan/SubscribePlanResp';
import { PlanType } from '@core/organization/domain/plan/PlanType';

export abstract class OrganizationRepository {
  abstract getPlan(): Promise<PlanInfo>;
  abstract getPlanDetail(): Promise<PlanDetail>;
  abstract subscribePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract revisePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract unsubscribePlan(): Promise<UnsubscribePlanResp>;
}

export class OrganizationRepositoryImpl extends OrganizationRepository {
  @InjectValue(DIKeys.BillingClient)
  private httpClient!: BaseClient;

  getPlan(): Promise<PlanInfo> {
    return this.httpClient
      .get<PlanInfo>('/billing/plan')
      .then(PlanInfo.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::getPlan::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  getPlanDetail(): Promise<PlanDetail> {
    return this.httpClient
      .get<PlanDetail>(`/billing/plan/detail`)
      .then(PlanDetail.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::getPlanDetail::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  unsubscribePlan(): Promise<UnsubscribePlanResp> {
    return this.httpClient
      .put<UnsubscribePlanResp>(`/billing/payment/unsubscribe`)
      .then(UnsubscribePlanResp.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::unsubscribePlan::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  subscribePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.httpClient
      .post<SubscribePlanResp>(`/billing/payment/subscribe`, { planType })
      .then(SubscribePlanResp.fromObject)
      .catch(e => {
        Log.error('OrganizationRepositoryImpl::subscribe::exception::', e.message);
        throw new DIException(e.message);
      });
  }

  revisePlan(planType: PlanType): Promise<SubscribePlanResp> {
    return this.httpClient
      .put<SubscribePlanResp>(`/billing/payment/revise`, { planType })
      .then(SubscribePlanResp.fromObject);
    // .catch(e => {
    //   debugger;
    //   Log.info(e);
    //   Log.error('OrganizationRepositoryImpl::revisePlan::exception::', e.message);
    //   throw new DIException(e.message);
    // });
  }
}
