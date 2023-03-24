import { BillingRepository, ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { Inject } from 'typescript-ioc';

export abstract class BillingService {
  abstract getProducts(): Promise<PageResult<ProductInfo>>;

  abstract getSubscriptionInfos(licenseKey: string): Promise<ProductSubscriptionInfo[]>;

  abstract subscribeProducts(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;

  abstract getSubscriptionInfo(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;
}

export class BillingServiceImpl extends BillingService {
  @Inject
  private readonly billingRepo!: BillingRepository;

  getProducts(): Promise<PageResult<ProductInfo>> {
    return this.billingRepo.getProducts();
  }

  getSubscriptionInfos(licenseKey: string): Promise<ProductSubscriptionInfo[]> {
    return this.billingRepo.getSubscriptionInfos(licenseKey);
  }

  subscribeProducts(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.subscribeProduct(licenseKey, productId);
  }

  getSubscriptionInfo(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.getSubscriptionInfo(licenseKey, productId);
  }

  cancelSubscription(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.billingRepo.cancelSubscription(licenseKey, productId);
  }
}
