import { PaymentMethod } from '@core/billing/domain/PaymentInfo/PaymentMethod';
import { PaymentStatus } from '@core/billing';

export class PaymentInfo {
  constructor(
    public className: PaymentMethod,
    public subscriptionId: string,
    public planId: string,
    public quantity: number,
    public productName: string,
    public paymentId: string,
    public status: PaymentStatus,
    public approvalLink?: string,
    public createdTime?: number,
    public updatedTime?: number
  ) {}

  get isCanceled() {
    return this.status === PaymentStatus.Canceled;
  }

  get isSubscribed() {
    return this.status === PaymentStatus.Succeeded;
  }

  get isBillingApprovalStatus() {
    return this.status === PaymentStatus.BillingApproval;
  }

  get isUnknownStatus() {
    return this.status === PaymentStatus.Unknown;
  }

  static fromObject(obj: PaymentInfo) {
    return new PaymentInfo(
      obj.className,
      obj.subscriptionId,
      obj.planId,
      obj.quantity,
      obj.productName,
      obj.paymentId,
      obj.status,
      obj?.approvalLink,
      obj?.createdTime,
      obj?.updatedTime
    );
  }
}
