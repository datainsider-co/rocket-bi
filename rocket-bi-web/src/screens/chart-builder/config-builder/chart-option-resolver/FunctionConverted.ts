/*
 * @author: tvc12 - Thien Vi
 * @created: 8/1/21, 11:25 PM
 */

import { FunctionConvertorData } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';
import { ConfigType, FunctionData } from '@/shared';

export interface FunctionConverted {
  chartOption: Record<string, any>;
  convertData: FunctionConvertorData;
  configsAsMap: Map<ConfigType, FunctionData[]>;
}
