/*
 * @author: tvc12 - Thien Vi
 * @created: 8/1/21, 11:25 PM
 */

import { FunctionRemovedData } from '@/screens/ChartBuilder/ConfigBuilder/ChartOptionResolver/FunctionRemovedData';
import { FunctionConverted } from '@/screens/ChartBuilder/ConfigBuilder/ChartOptionResolver/FunctionConverted';
import { ChartOption } from '@core/domain';
import { StringUtils } from '@/utils/string.utils';
import { Log } from '@core/utils';

export abstract class ChartOptionHandler {
  abstract handleFunctionRemoved(data: FunctionRemovedData): Record<string, any>;

  abstract handleFunctionConverted(data: FunctionConverted): Record<string, any>;
}

export class DefaultChartOptionHandler extends ChartOptionHandler {
  handleFunctionConverted(data: FunctionConverted): Record<string, any> {
    return data.chartOption;
  }

  handleFunctionRemoved(data: FunctionRemovedData): Record<string, any> {
    return data.chartOption;
  }
}

export class TableChartOptionHandler extends ChartOptionHandler {
  handleFunctionConverted(data: FunctionConverted): Record<string, any> {
    const currentChartOption: ChartOption = ChartOption.fromObject(data.chartOption as any);
    Log.debug('currentChartOption::beforemove', currentChartOption.options.conditionalFormatting);
    currentChartOption.removeOption(`conditionalFormatting`);
    Log.debug('currentChartOption::handleFunctionConverted', currentChartOption.options.conditionalFormatting);
    return currentChartOption;
  }

  handleFunctionRemoved(data: FunctionRemovedData): Record<string, any> {
    const configRemovedName: string = StringUtils.toCamelCase(data.removedConfig.name);
    const currentChartOption: ChartOption = ChartOption.fromObject(data.chartOption as any);
    currentChartOption.removeOption(`fieldFormatting.${configRemovedName}`);
    currentChartOption.removeOption(`conditionalFormatting.${configRemovedName}`);
    return currentChartOption;
  }
}

export class PivotTableChartOptionHandler extends ChartOptionHandler {
  handleFunctionConverted(data: FunctionConverted): Record<string, any> {
    return data.chartOption;
  }

  handleFunctionRemoved(data: FunctionRemovedData): Record<string, any> {
    const configRemovedName: string = StringUtils.toCamelCase(data.removedConfig.name);
    const currentChartOption: ChartOption = ChartOption.fromObject(data.chartOption as any);
    currentChartOption.removeOption(`fieldFormatting.${configRemovedName}`);
    currentChartOption.removeOption(`conditionalFormatting.${configRemovedName}`);
    return currentChartOption;
  }
}
