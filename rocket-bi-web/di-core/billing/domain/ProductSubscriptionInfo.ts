import { PaymentInfo, ProductSubscription } from '@core/billing';

export class ProductSubscriptionInfo {
  constructor(public subscription: ProductSubscription, public payment: PaymentInfo) {}

  static fromObject(obj: ProductSubscriptionInfo) {
    const subscription = ProductSubscription.fromObject(obj.subscription);
    const payment = PaymentInfo.fromObject(obj.payment);
    return new ProductSubscriptionInfo(subscription, payment);
  }
}
