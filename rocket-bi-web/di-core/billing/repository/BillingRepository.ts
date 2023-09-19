import { ProductInfo, ProductSubscriptionInfo } from '@core/billing';
import { InjectValue } from 'typescript-ioc';
import { DIKeys } from '@core/common/modules';
import { BaseClient } from '@core/common/services';
import { PlanType } from '@core/organization/domain/Plan/PlanType';
import { Log } from '@core/utils';
import { DIException } from '@core/common/domain';

export abstract class BillingRepository {
  abstract getProducts(): Promise<ProductInfo[]>;

  abstract subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo>;

  abstract getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo>;

  abstract cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo>;

  abstract redeemCode(licenseKey: string, code: string): Promise<boolean>;
}

export class BillingRepositoryImpl extends BillingRepository {
  @InjectValue(DIKeys.BillingClient)
  private readonly client!: BaseClient;

  getProducts(): Promise<ProductInfo[]> {
    return this.client.get<ProductInfo[]>(`/billing/plan`).then(res => {
      const products = res.map(product => ProductInfo.fromObject(product));
      return products;
    });
  }

  subscribeProduct(licenseKey: string, planType: PlanType): Promise<ProductSubscriptionInfo> {
    return this.client
      .put<ProductSubscriptionInfo>(`/billing/plan/${licenseKey}`, { planType })
      .then(res => ProductSubscriptionInfo.fromObject(res));
  }

  getSubscriptionInfo(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.client.get<ProductSubscriptionInfo>(`/billing/plan/${licenseKey}`).then(res => ProductSubscriptionInfo.fromObject(res));
  }

  cancelSubscription(licenseKey: string): Promise<ProductSubscriptionInfo> {
    return this.client.put<ProductSubscriptionInfo>(`/billing/plan/${licenseKey}/cancel`).then(res => ProductSubscriptionInfo.fromObject(res));
  }

  async redeemCode(licenseKey: string, code: string): Promise<boolean> {
    const response: any = await this.client.post(`/billing/licenses/${licenseKey}/redeem`, { code: code });
    return response.status;
  }
}
