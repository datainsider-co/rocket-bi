import { PaymentInfo } from '@core/billing';

export class SubscriptionInfo {
  constructor(
    public licenseKey: string,
    public productIds: string[],
    public expired: boolean,
    public suspended: boolean,
    public paymentInfo?: PaymentInfo,
    public startTime?: number,
    public endTime?: number
  ) {}

  static fromObject(obj: SubscriptionInfo) {
    return new SubscriptionInfo(
      obj.licenseKey,
      obj.productIds,
      obj.expired,
      obj.suspended,
      obj?.paymentInfo ? PaymentInfo.fromObject(obj.paymentInfo) : void 0,
      obj?.startTime,
      obj?.endTime
    );
  }
}
