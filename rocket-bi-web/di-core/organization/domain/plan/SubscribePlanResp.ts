export class SubscribePlanResp {
  subscriptionId: string;
  approvalLink: string;

  constructor(subscriptionId: string, approvalLink: string) {
    this.subscriptionId = subscriptionId;
    this.approvalLink = approvalLink;
  }

  static fromObject(obj: SubscribePlanResp): SubscribePlanResp {
    return new SubscribePlanResp(obj.subscriptionId, obj.approvalLink);
  }
}
