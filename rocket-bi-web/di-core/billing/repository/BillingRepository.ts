import { ProductInfo, SubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services';
import { BaseResponse } from '@core/data-ingestion/domain/response/BaseResponse';

export abstract class BillingRepository {
  abstract getProducts(): Promise<PageResult<ProductInfo>>;

  abstract getSubscriptionInfo(licenseKey: string): Promise<SubscriptionInfo>;

  abstract subscribeProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo>;

  abstract updateProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string): Promise<boolean>;
}

export class BillingRepositoryImpl extends BillingRepository {
  @InjectValue(DIKeys.BillingClient)
  private httpClient!: BaseClient;

  getProducts(): Promise<PageResult<ProductInfo>> {
    return this.httpClient.get<PageResult<ProductInfo>>(`/billing/products/list`).then(res => {
      const products = res.data.map(product => ProductInfo.fromObject(product));
      return new PageResult<ProductInfo>(products, res.total);
    });
  }

  getSubscriptionInfo(licenseKey: string): Promise<SubscriptionInfo> {
    return this.httpClient.get<SubscriptionInfo>(`/billing/subscriptions/${licenseKey}`).then(res => SubscriptionInfo.fromObject(res));
  }

  subscribeProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo> {
    return this.httpClient
      .post<SubscriptionInfo>(`/billing/subscriptions/${licenseKey}`, { productIds })
      .then(res => SubscriptionInfo.fromObject(res));
  }

  updateProducts(licenseKey: string, productIds: string[]): Promise<SubscriptionInfo> {
    return this.httpClient
      .put<SubscriptionInfo>(`/billing/subscriptions/${licenseKey}`, { productIds })
      .then(res => SubscriptionInfo.fromObject(res));
  }

  cancelSubscription(licenseKey: string): Promise<boolean> {
    return this.httpClient.put<BaseResponse>(`/billing/subscriptions/${licenseKey}/cancel`).then(res => res.success);
  }
}
