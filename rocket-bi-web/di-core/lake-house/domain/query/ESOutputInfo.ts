/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:49 PM
 */

export enum WriteMode {
  Replace = 'Replace',
  Error = 'Error',
  Ignore = 'Ignore',
  Append = 'Append'
}

export class ESOutputInfo {
  constructor(
    public servers: string[],
    public index: string,
    public type: string,
    public timestamp: number,
    public timestampField: string,
    public customConfig: any,
    public writeMode: WriteMode
  ) {}

  static fromObject(obj: any): ESOutputInfo {
    return new ESOutputInfo(obj.servers, obj.index, obj.type, obj.timestamp, obj.timestampField, obj.customConfig, obj.writeMode);
  }
}
