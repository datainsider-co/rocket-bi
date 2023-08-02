import { BillingRepository, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { Inject } from 'typescript-ioc';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

export abstract class BillingService {
  abstract getProducts(): Promise<ProductInfo[]>;

  abstract subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo>;

  abstract getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo>;
}

export class BillingServiceImpl extends BillingService {
  @Inject
  private readonly billingRepo!: BillingRepository;

  getProducts(): Promise<ProductInfo[]> {
    return this.billingRepo.getProducts();
  }

  subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.subscribeProduct(licenseKey, planType);
  }

  getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.getSubscriptionInfo(licenseKey);
  }

  cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.cancelSubscription(licenseKey);
  }
}
