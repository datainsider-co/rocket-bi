import { PaymentInfo, PaymentStatus, ProductInfo, ProductSubscription } from '@core/billing';
import { PlanDetail } from '@core/organization';
import { PlanType } from '@core/organization/domain/Plan/PlanType';

export class ProductSubscriptionInfo {
  constructor(public product: ProductInfo, public subscription: ProductSubscription, public payment?: PaymentInfo) {}

  static fromObject(obj: ProductSubscriptionInfo) {
    const subscription = ProductSubscription.fromObject(obj.subscription);
    const product = ProductInfo.fromObject(obj.product);
    const payment = obj?.payment ? PaymentInfo.fromObject(obj?.payment) : undefined;
    return new ProductSubscriptionInfo(product, subscription, payment);
  }

  toPlanDetail(): PlanDetail {
    return new PlanDetail(
      -1,
      this.product.name as PlanType,
      this.subscription.startTime,
      this.subscription.endTime,
      this.payment?.subscriptionId ?? '',
      this.payment?.paymentId ?? '',
      this.product?.price ?? 0,
      'PayPal',
      this.payment?.status ?? PaymentStatus.Unknown,
      this.subscription.updatedTime,
      this.payment?.billingEmail ?? '',
      this.payment?.approvalLink ?? '',
      this.subscription.id,
      this.product.editorSeats
    );
  }
}
