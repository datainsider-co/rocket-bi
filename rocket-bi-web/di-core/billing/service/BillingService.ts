import { BillingRepository, ProductInfo, SubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { Inject } from 'typescript-ioc';

export abstract class BillingService {
  abstract getProducts(): Promise<PageResult<ProductInfo>>;

  abstract getSubscriptionInfo(licenseKey: string): Promise<SubscriptionInfo>;

  abstract subscribeProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo>;

  abstract updateProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string): Promise<boolean>;
}

export class BillingServiceImpl extends BillingService {
  @Inject
  private readonly billingRepo!: BillingRepository;

  getProducts(): Promise<PageResult<ProductInfo>> {
    return this.billingRepo.getProducts();
  }

  getSubscriptionInfo(email: string): Promise<SubscriptionInfo> {
    return this.billingRepo.getSubscriptionInfo(email);
  }

  subscribeProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo> {
    return this.billingRepo.subscribeProducts(licenseKey, productIds);
  }

  updateProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo> {
    return this.billingRepo.updateProducts(licenseKey, productIds);
  }

  cancelSubscription(licenseKey: string): Promise<boolean> {
    return this.billingRepo.cancelSubscription(licenseKey);
  }
}
