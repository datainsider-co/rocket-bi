import { PaymentMethod } from './PaymentMethod';
import { PaymentStatus } from './PaymentStatus';
import { PaymentInfo } from './PaymentInfo';

export class RedeemCodePaymentInfo extends PaymentInfo {
  readonly className: PaymentMethod = PaymentMethod.RedeemCode;

  id: string;
  code: string;
  usedBy: string;
  usedFor: string;
  startTime: number;
  endTime: number;
  createdTime: number;
  updatedTime: number;
  productId: string;

  constructor(data: {
    id: string;
    code: string;
    usedBy: string;
    usedFor: string;
    startTime: number;
    endTime: number;
    createdTime: number;
    updatedTime: number;
    productId: string;
    status: PaymentStatus;
  }) {
    super(data.status);
    this.id = data.id;
    this.code = data.code;
    this.usedBy = data.usedBy;
    this.usedFor = data.usedFor;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.createdTime = data.createdTime;
    this.updatedTime = data.updatedTime;
    this.productId = data.productId;
  }

  static fromObject(obj: RedeemCodePaymentInfo): RedeemCodePaymentInfo {
    return new RedeemCodePaymentInfo(obj);
  }
}
