/*
 * @author: tvc12 - Thien Vi
 * @created: 8/1/21, 11:15 PM
 */

import { ChartType } from '@/shared';
import {
  ChartOptionHandler,
  DefaultChartOptionHandler,
  PivotTableChartOptionHandler,
  TableChartOptionHandler
} from '@/screens/ChartBuilder/ConfigBuilder/ChartOptionResolver/ChartOptionHandler';
import { FunctionRemovedData } from '@/screens/ChartBuilder/ConfigBuilder/ChartOptionResolver/FunctionRemovedData';
import { FunctionConverted } from '@/screens/ChartBuilder/ConfigBuilder/ChartOptionResolver/FunctionConverted';
import { Log } from '@core/utils';

export class ChartOptionResolver {
  private readonly handlerAsMap: Map<ChartType, ChartOptionHandler>;
  private defaultHandler = new DefaultChartOptionHandler();
  constructor() {
    this.handlerAsMap = new Map([
      [ChartType.Table, new TableChartOptionHandler()],
      [ChartType.PivotTable, new PivotTableChartOptionHandler()]
    ]);
  }

  handleFunctionRemoved(chartType: ChartType, data: FunctionRemovedData): Record<string, any> {
    try {
      const chartOptionHandler: ChartOptionHandler = this.handlerAsMap.get(chartType) ?? this.defaultHandler;
      Log.debug('handleFunctionRemoved::', chartType, 'handler::', chartOptionHandler);
      return chartOptionHandler.handleFunctionRemoved(data);
    } catch (ex) {
      return data.chartOption;
    }
  }

  handleFunctionConverted(chartType: ChartType, data: FunctionConverted): Record<string, any> {
    try {
      const chartOptionHandler: ChartOptionHandler = this.handlerAsMap.get(chartType) ?? this.defaultHandler;
      Log.debug('handleFunctionConverted::', chartType, 'handler::', chartOptionHandler);
      return chartOptionHandler.handleFunctionConverted(data);
    } catch (ex) {
      return data.chartOption;
    }
  }
}
