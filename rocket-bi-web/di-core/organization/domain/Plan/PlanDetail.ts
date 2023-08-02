import { PlanInfo } from '@core/organization/domain/Plan/PlanInfo';
import { PlanType } from '@core/organization/domain/Plan/PlanType';
import { PaymentStatus } from '@core/billing';

export class PlanDetail extends PlanInfo {
  lastPaymentAmount: number;
  lastPaymentMethod: string;
  lastPaymentStatus: PaymentStatus;
  lastPaymentDate: number;
  invoiceEmail: string;
  payPalApprovalUrl: string;
  payPalSubscriptionId: string;
  editorSeats: number;

  constructor(
    organizationId: number,
    planType: PlanType,
    startDate: number,
    endDate: number,
    paypalSubscriptionId: string,
    lastPaymentId: string,
    lastPaymentAmount: number,
    lastPaymentMethod: string,
    lastPaymentStatus: PaymentStatus,
    lastPaymentDate: number,
    invoiceEmail: string,
    payPalApprovalUrl: string,
    payPalSubscriptionId: string,
    editorSeats: number
  ) {
    super(organizationId, planType, startDate, endDate, paypalSubscriptionId, lastPaymentId);
    this.lastPaymentAmount = lastPaymentAmount;
    this.lastPaymentMethod = lastPaymentMethod;
    this.lastPaymentStatus = lastPaymentStatus;
    this.lastPaymentDate = lastPaymentDate;
    this.invoiceEmail = invoiceEmail;
    this.payPalApprovalUrl = payPalApprovalUrl;
    this.payPalSubscriptionId = payPalSubscriptionId;
    this.editorSeats = editorSeats;
  }

  static fromObject(obj: PlanDetail): PlanDetail {
    return new PlanDetail(
      obj.organizationId,
      obj.planType,
      obj.startDate,
      obj.endDate,
      obj.paypalSubscriptionId,
      obj.lastPaymentId,
      obj.lastPaymentAmount,
      obj.lastPaymentMethod,
      obj.lastPaymentStatus,
      obj.lastPaymentDate,
      obj.invoiceEmail,
      obj.payPalApprovalUrl,
      obj.payPalSubscriptionId,
      obj.editorSeats
    );
  }

  get isSucceeded() {
    return this.lastPaymentStatus === PaymentStatus.Succeeded;
  }
}
