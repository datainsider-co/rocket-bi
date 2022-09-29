/*
 * @author: tvc12 - Thien Vi
 * @created: 5/24/21, 11:09 AM
 */

import { ConfigType, FunctionData, ChartType } from '@/shared';
import { FunctionConvertor, FunctionConvertorData } from '@/screens/chart-builder/config-builder/function-convertor/FunctionConvertor';

export class FunctionConvertResolver {
  constructor(private readonly mapConvertors: Map<ChartType, FunctionConvertor>) {}

  canConvert(convertorData: FunctionConvertorData): boolean {
    const convertor: FunctionConvertor | undefined = this.mapConvertors.get(convertorData.itemSelected.type as ChartType);
    return convertor?.canConvert(convertorData) ?? false;
  }

  convert(convertorData: FunctionConvertorData): Map<ConfigType, FunctionData[]> {
    const convertor: FunctionConvertor | undefined = this.mapConvertors.get(convertorData.itemSelected.type as ChartType);
    return convertor?.convert(convertorData) ?? convertorData.mapConfigs;
  }
}
