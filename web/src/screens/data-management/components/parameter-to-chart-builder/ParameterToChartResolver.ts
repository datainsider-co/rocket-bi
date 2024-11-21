import { ChartInfo, ParamValueType, QueryParameter } from '@core/common/domain';
import { ParamChartHandler } from '@/screens/data-management/components/parameter-to-chart-builder/ParamChartHandler';

export abstract class ParameterToChartResolver {
  abstract buildChart(parameter: QueryParameter): ChartInfo;
}

export class ParameterToChartResolverImpl implements ParameterToChartResolver {
  private readonly mapCreator: Map<ParamValueType, ParamChartHandler>;
  private readonly defaultCreator: ParamChartHandler;

  constructor(mapCreator: Map<ParamValueType, ParamChartHandler>, defaultCreator: ParamChartHandler) {
    this.mapCreator = mapCreator;
    this.defaultCreator = defaultCreator;
  }

  buildChart(parameter: QueryParameter): ChartInfo {
    const handler: ParamChartHandler | undefined = this.mapCreator.get(parameter.valueType);
    if (handler) {
      return handler.buildChart(parameter);
    } else {
      return this.defaultCreator.buildChart(parameter);
    }
  }
}
