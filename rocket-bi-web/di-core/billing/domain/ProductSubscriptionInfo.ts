import { PaymentStatus, ProductInfo, ProductSubscription } from '@core/billing';
import { PaymentInfo } from '@core/billing/domain/PaymentInfo';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

export class ProductSubscriptionInfo {
  constructor(public product: ProductInfo, public subscription: ProductSubscription, public payment?: PaymentInfo) {}

  static fromObject(obj: ProductSubscriptionInfo) {
    const subscription = ProductSubscription.fromObject(obj.subscription);
    const product = ProductInfo.fromObject(obj.product);
    const payment = obj?.payment ? PaymentInfo.fromObject(obj.payment) : void 0;
    return new ProductSubscriptionInfo(product, subscription, payment);
  }

  isPaymentSucceeded(): boolean {
    return this.payment?.status === PaymentStatus.Succeeded;
  }

  get isPaidPlan(): boolean {
    return [PlanType.Startup, PlanType.Business, PlanType.Cooperate, PlanType.OnPremise].includes(this.product.name);
  }

  get startTime(): number {
    return this.subscription.startTime ?? 0;
  }

  get endTime(): number {
    return this.subscription.endTime ?? 0;
  }

  get planType(): PlanType {
    return this.product.name;
  }
}
