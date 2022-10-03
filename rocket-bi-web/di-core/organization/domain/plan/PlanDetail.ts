import { PlanInfo } from '@core/organization/domain/plan/PlanInfo';
import { PlanType } from '@core/organization/domain/plan/PlanType';

export class PlanDetail extends PlanInfo {
  lastPaymentAmount: number;
  lastPaymentMethod: string;
  lastPaymentStatus: string;
  lastPaymentDate: number;
  invoiceEmail: string;
  payPalApprovalUrl: string;
  payPalSubscriptionId: string;

  constructor(
    organizationId: number,
    planType: PlanType,
    startDate: number,
    endDate: number,
    paypalSubscriptionId: string,
    lastPaymentId: number,
    lastPaymentAmount: number,
    lastPaymentMethod: string,
    lastPaymentStatus: string,
    lastPaymentDate: number,
    invoiceEmail: string,
    payPalApprovalUrl: string,
    payPalSubscriptionId: string
  ) {
    super(organizationId, planType, startDate, endDate, paypalSubscriptionId, lastPaymentId);
    this.lastPaymentAmount = lastPaymentAmount;
    this.lastPaymentMethod = lastPaymentMethod;
    this.lastPaymentStatus = lastPaymentStatus;
    this.lastPaymentDate = lastPaymentDate;
    this.invoiceEmail = invoiceEmail;
    this.payPalApprovalUrl = payPalApprovalUrl;
    this.payPalSubscriptionId = payPalSubscriptionId;
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
      obj.payPalSubscriptionId
    );
  }
}
