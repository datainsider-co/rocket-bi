import { PaymentInfo } from '@core/billing';

export class License {
  constructor(public key: string, public expired: boolean, public paymentInfo?: PaymentInfo, public createdAt?: number, public expiredAt?: number) {}

  static fromObject(obj: License) {
    return new License(obj.key, obj.expired, obj?.paymentInfo ? PaymentInfo.fromObject(obj.paymentInfo) : void 0, obj?.createdAt, obj?.expiredAt);
  }
}
