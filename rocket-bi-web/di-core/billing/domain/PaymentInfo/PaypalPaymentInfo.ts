import { PaymentMethod } from './PaymentMethod';
import { PaymentStatus } from './PaymentStatus';
import { PaymentInfo } from './PaymentInfo';

export class PaypalPaymentInfo extends PaymentInfo {
  readonly className: PaymentMethod = PaymentMethod.Paypal;
  constructor(
    public subscriptionId: string,
    public planId: string,
    public quantity: number,
    public productName: string,
    public paymentId: string,
    status: PaymentStatus,
    public billingEmail: string,
    public approvalLink?: string,
    public createdTime?: number,
    public updatedTime?: number
  ) {
    super(status);
  }

  static fromObject(obj: PaypalPaymentInfo): PaypalPaymentInfo {
    return new PaypalPaymentInfo(
      obj.subscriptionId,
      obj.planId,
      obj.quantity,
      obj.productName,
      obj.paymentId,
      obj.status,
      obj.billingEmail,
      obj?.approvalLink,
      obj?.createdTime,
      obj?.updatedTime
    );
  }

  static isPaypalPaymentInfo(obj: any): obj is PaypalPaymentInfo {
    return obj?.className === PaymentMethod.Paypal;
  }
}
