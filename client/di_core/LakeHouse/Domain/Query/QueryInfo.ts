/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:34 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:29 PM
 */

import { NotifyInfo } from './NotifyInfo';
import { QueryOutputTemplate } from './QueryOutputTemplate';
import { Priority } from './NotebookInfo';

export enum QueryType {
  Default = 0,
  Periodic = 1
}

export enum QueryState {
  WAITING,
  RUNNING,
  SUCCEEDED,
  FAILED,
  CANCELLED
}

export class QueryInfo {
  id: string;
  query: string;
  state: QueryState;
  ownerId: string;
  createTime: number;
  executeTime: number;
  endTime: number;
  resultPath: string;
  priority: Priority;
  outputFields?: string[];
  notifyInfo: NotifyInfo[];
  extraInfo: string;
  type: QueryType;
  outputs: QueryOutputTemplate[];
  parentId: string;

  constructor(
    id: string,
    query: string,
    state: number,
    ownerId: string,
    createTime: number,
    executeTime: number,
    endTime: number,
    resultPath: string,
    priority: Priority,
    notifyInfo: NotifyInfo[],
    extraInfo: string,
    type: QueryType,
    outputs: QueryOutputTemplate[],
    parentId: string,
    outputFields?: string[]
  ) {
    this.id = id;
    this.query = query;
    this.state = state;
    this.ownerId = ownerId;
    this.createTime = createTime;
    this.executeTime = executeTime;
    this.endTime = endTime;
    this.resultPath = resultPath;
    this.priority = priority;
    this.outputFields = outputFields;
    this.notifyInfo = notifyInfo;
    this.extraInfo = extraInfo;
    this.type = type;
    this.outputs = outputs;
    this.parentId = parentId;
  }

  static fromObject(obj: any): QueryInfo {
    const notifyInfo: NotifyInfo[] = (obj.notifyInfo ?? []).map((notify: any) => NotifyInfo.fromObject(notify));
    const outputs: QueryOutputTemplate[] = (obj.outputs ?? []).map((output: any) => QueryOutputTemplate.fromObject(output));
    return new QueryInfo(
      obj.id,
      obj.query,
      obj.state,
      obj.ownerId,
      obj.createTime,
      obj.executeTime,
      obj.endTime,
      obj.resultPath,
      obj.priority,
      notifyInfo,
      obj.extraInfo,
      obj.type,
      outputs,
      obj.parentId,
      obj.outputFields
    );
  }
}
