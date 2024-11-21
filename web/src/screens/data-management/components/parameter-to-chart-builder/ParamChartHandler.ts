import { ChartInfo, QueryParameter } from '@core/common/domain';

export abstract class ParamChartHandler {
  abstract buildChart(parameter: QueryParameter): ChartInfo;
}
