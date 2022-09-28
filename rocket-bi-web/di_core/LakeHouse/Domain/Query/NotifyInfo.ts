/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:32 PM
 */

export class NotifyInfo {
  constructor(public type: string, public receiver: string) {}

  static fromObject(obj: any) {
    return new NotifyInfo(obj.type, obj.receiver);
  }
}
