import { ParamValueType } from '@core/common/domain';
import { ParamChartHandler } from '@/screens/data-management/components/parameter-to-chart-builder/ParamChartHandler';
import {
  ParameterToChartResolver,
  ParameterToChartResolverImpl
} from '@/screens/data-management/components/parameter-to-chart-builder/ParameterToChartResolver';

export class ParameterToChartResolverBuilder {
  private readonly mapCreator: Map<ParamValueType, ParamChartHandler>;
  private defaultHandler: ParamChartHandler;

  constructor(defaultHandler: ParamChartHandler) {
    this.mapCreator = new Map();
    this.defaultHandler = defaultHandler;
  }

  add(type: ParamValueType, handler: ParamChartHandler): ParameterToChartResolverBuilder {
    this.mapCreator.set(type, handler);
    return this;
  }

  build(): ParameterToChartResolver {
    return new ParameterToChartResolverImpl(this.mapCreator, this.defaultHandler);
  }
}
