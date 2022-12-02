import { PlanDetail, PlanInfo, SubscribePlanResp } from '../domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services/HttpClient';
import { UnsubscribePlanResp } from '@core/organization/domain/plan/UnsubscribePlanResp';
import { Log } from '@core/utils';
import { DIException, Organization } from '@core/common/domain';
import { PlanType } from '@core/organization/domain/plan/PlanType';
import { UpdateOrganizationRequest } from '@core/organization/domain/request/UpdateOrganizationRequest';

export abstract class OrganizationRepository {
  abstract getPlan(): Promise<PlanInfo>;
  abstract getPlanDetail(): Promise<PlanDetail>;
  abstract subscribePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract revisePlan(planType: PlanType): Promise<SubscribePlanResp>;
  abstract unsubscribePlan(): Promise<UnsubscribePlanResp>;
  abstract getOrganization(): Promise<Organization>;
  abstract updateOrganization(request: UpdateOrganizationRequest): Promise<Organization>;
}

export class OrganizationRepositoryImpl extends OrganizationRepository {
  @InjectValue(DIKeys.BillingClient)
  private httpClient!: BaseClient;

  @InjectValue(DIKeys.CaasClient)
  private orgClient!: BaseClient;

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

  getOrganization(): Promise<Organization> {
    return this.orgClient.get('/organizations/my-domain').then(Organization.fromObject);
  }

  updateOrganization(request: UpdateOrganizationRequest): Promise<Organization> {
    return this.orgClient.put('/organizations', request).then(Organization.fromObject);
  }
}
