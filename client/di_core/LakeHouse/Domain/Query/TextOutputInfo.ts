/*
 * @author: tvc12 - Thien Vi
 * @created: 11/12/21, 1:44 PM
 */

import { WriteMode } from './ESOutputInfo';
import { TimeUnit } from '@core/LakeHouse';

export class TextOutputInfo {
  static readonly DEFAULT_PARTITION = 'YYYY/MM/DD';
  static readonly DEFAULT_INTERVAL = 0;
  static readonly DEFAULT_INTERVAL_UNIT = 4;
  constructor(
    public resultPath: string,
    public hdfsUri: string,
    public writeMode: WriteMode // public partitionPattern?: string, // public delay?: number, // public delayUnit?: TimeUnit
  ) {}

  static fromObject(obj: any) {
    return new TextOutputInfo(obj.resultPath, obj.hdfsUri, obj.writeMode);
  }
}
