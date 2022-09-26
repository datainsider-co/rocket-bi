export class UnsubscribePlanResp {
  success: boolean;

  constructor(success: boolean) {
    this.success = success;
  }

  static fromObject(obj: UnsubscribePlanResp): UnsubscribePlanResp {
    return new UnsubscribePlanResp(obj.success);
  }
}
