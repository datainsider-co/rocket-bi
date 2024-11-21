/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 2:28 PM
 */

import { NotifyInfo } from '@core/lake-house/domain/query/NotifyInfo';

export enum Priority {
  Low = 0,
  Normal = 1,
  High = 2
}

export class NotebookInfo {
  constructor(
    public id: string,
    public name: string,
    public query: string,
    public description: string,
    public createTime: number,
    public ownerId: string,
    public priority: Priority,
    public notifyInfo: NotifyInfo[]
  ) {}

  static fromObject(obj: any) {
    const notifyInfo: NotifyInfo[] = (obj.notifyInfo ?? []).map((notify: any) => NotifyInfo.fromObject(notify));
    return new NotebookInfo(obj.id, obj.name, obj.query, obj.description, obj.createTime, obj.ownerId, obj.priority, notifyInfo);
  }
}
