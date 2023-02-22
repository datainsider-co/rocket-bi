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
