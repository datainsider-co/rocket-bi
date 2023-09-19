import { BillingRepository, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { Inject } from 'typescript-ioc';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

export abstract class BillingService {
  abstract getProducts(): Promise<ProductInfo[]>;

  abstract subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo>;

  abstract getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo>;

  abstract redeemCode(licenseKey: string, code: string): Promise<boolean>;
}

export class BillingServiceImpl extends BillingService {
  @Inject
  private readonly repository!: BillingRepository;

  getProducts(): Promise<ProductInfo[]> {
    return this.repository.getProducts();
  }

  subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo> {
    return this.repository.subscribeProduct(licenseKey, planType);
  }

  getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.repository.getSubscriptionInfo(licenseKey);
  }

  cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.repository.cancelSubscription(licenseKey);
  }

  redeemCode(licenseKey: string, code: string): Promise<boolean> {
    return this.repository.redeemCode(licenseKey, code);
  }
}
