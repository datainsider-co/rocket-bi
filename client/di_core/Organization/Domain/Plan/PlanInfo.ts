import { PlanType, PlanTypeBgColors, PlanTypeIcon } from '@core/Organization/Domain/Plan/PlanType';

const NOT_PAYMENT_ID = -1;

export class PlanInfo {
  organizationId: number;
  planType: PlanType;
  startDate: number;
  endDate: number;
  paypalSubscriptionId: string;
  lastPaymentId: number;

  constructor(organizationId: number, planType: PlanType, startDate: number, endDate: number, paypalSubscriptionId: string, lastPaymentId: number) {
    this.organizationId = organizationId;
    this.planType = planType;
    this.startDate = startDate;
    this.endDate = endDate;
    this.paypalSubscriptionId = paypalSubscriptionId;
    this.lastPaymentId = lastPaymentId;
  }

  static fromObject(obj: PlanInfo): PlanInfo {
    return new PlanInfo(obj.organizationId, obj.planType, obj.startDate, obj.endDate, obj.paypalSubscriptionId, obj.lastPaymentId);
  }

  get notPaymentYet() {
    return this.lastPaymentId === NOT_PAYMENT_ID;
  }

  get icon() {
    return PlanTypeIcon[this.planType];
  }

  get bgColors() {
    return PlanTypeBgColors[this.planType];
  }

  get isPaidPlan() {
    return [PlanType.Starter, PlanType.Professional, PlanType.Enterprise, PlanType.OnPremise].includes(this.planType);
  }
}
