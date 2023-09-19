import { PaymentMethod } from './PaymentMethod';
import { PaymentStatus } from './PaymentStatus';
import { PaymentInfo } from './PaymentInfo';

export class UnknownPaymentInfo extends PaymentInfo {
  readonly className: PaymentMethod;

  constructor(className: PaymentMethod, status: PaymentStatus) {
    super(status);
    this.className = className;
  }

  static fromObject(obj: UnknownPaymentInfo): UnknownPaymentInfo {
    return new UnknownPaymentInfo(obj.className, obj.status);
  }

  static default(): UnknownPaymentInfo {
    return new UnknownPaymentInfo(PaymentMethod.Unknown, PaymentStatus.Unknown);
  }
}
