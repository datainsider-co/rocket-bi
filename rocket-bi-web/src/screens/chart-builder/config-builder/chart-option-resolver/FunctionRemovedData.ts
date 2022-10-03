/*
 * @author: tvc12 - Thien Vi
 * @created: 8/1/21, 11:25 PM
 */

import { ConfigType, FunctionData } from '@/shared';

export interface FunctionRemovedData {
  chartOption: Record<string, any>;
  configType: ConfigType;
  removedConfig: FunctionData;
}
