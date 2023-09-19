import { PaymentMethod } from './PaymentMethod';
import { PaymentStatus } from './PaymentStatus';
import { PaypalPaymentInfo, RedeemCodePaymentInfo, UnknownPaymentInfo } from '@core/billing';

export abstract class PaymentInfo {
  abstract readonly className: PaymentMethod;

  status: PaymentStatus;

  protected constructor(status: PaymentStatus) {
    this.status = status;
  }

  static fromObject(obj: any): PaymentInfo {
    switch (obj.className) {
      case PaymentMethod.Paypal:
        return PaypalPaymentInfo.fromObject(obj);
      case PaymentMethod.RedeemCode:
        return RedeemCodePaymentInfo.fromObject(obj);
      default:
        return UnknownPaymentInfo.fromObject(obj);
    }
  }
}
