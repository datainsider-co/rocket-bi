import { PlanType, PlanTypeBgColors, PlanTypeIcon } from '@core/organization/domain/Plan/PlanType';

const NOT_PAYMENT_ID = -1;

export class PlanInfo {
  organizationId: number;
  planType: PlanType;
  startDate: number;
  endDate: number;
  paypalSubscriptionId: string;
  lastPaymentId: string;

  constructor(organizationId: number, planType: PlanType, startDate: number, endDate: number, paypalSubscriptionId: string, lastPaymentId: string) {
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

  get icon() {
    return PlanTypeIcon[this.planType];
  }

  get bgColors() {
    return PlanTypeBgColors[this.planType];
  }

  get isPaidPlan() {
    return [PlanType.Startup, PlanType.Business, PlanType.Cooperate, PlanType.OnPremise].includes(this.planType);
  }
}
