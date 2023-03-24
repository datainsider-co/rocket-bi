import { ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { PageResult } from '@core/common/domain';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services';
import { BaseResponse } from '@core/data-ingestion/domain/response/BaseResponse';

export abstract class BillingRepository {
  abstract getProducts(): Promise<PageResult<ProductInfo>>;

  abstract getSubscriptionInfos(licenseKey: string): Promise<ProductSubscriptionInfo[]>;

  abstract subscribeProduct(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;

  abstract getSubscriptionInfo(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo>;
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

  getSubscriptionInfos(licenseKey: string): Promise<ProductSubscriptionInfo[]> {
    return this.httpClient.get<ProductSubscriptionInfo[]>(`/billing/subscriptions/${licenseKey}/products`).then(res => {
      return res.map(subscriptionInfo => ProductSubscriptionInfo.fromObject(subscriptionInfo));
    });
  }

  subscribeProduct(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.httpClient
      .post<ProductSubscriptionInfo>(`/billing/subscriptions/${licenseKey}/products/${productId}`)
      .then(res => ProductSubscriptionInfo.fromObject(res));
  }

  getSubscriptionInfo(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.httpClient
      .get<ProductSubscriptionInfo>(`/billing/subscriptions/${licenseKey}/products/${productId}`)
      .then(res => ProductSubscriptionInfo.fromObject(res));
  }

  cancelSubscription(licenseKey: string, productId: string): Promise<ProductSubscriptionInfo> {
    return this.httpClient
      .put<ProductSubscriptionInfo>(`/billing/subscriptions/${licenseKey}/products/${productId}/cancel`)
      .then(res => ProductSubscriptionInfo.fromObject(res));
  }
}
