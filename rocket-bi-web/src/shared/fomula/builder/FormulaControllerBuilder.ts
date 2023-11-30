import { ConnectorType } from '@core/connector-config';
import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FormulaControllerFactoryResolver } from '@/shared/fomula/builder/FormulaControllerFactoryResolver';

export class FormulaControllerResolverBuilder {
  private mapCreator: Map<ConnectorType, FormulaControllerFactory> = new Map();

  add(type: ConnectorType, handler: FormulaControllerFactory): FormulaControllerResolverBuilder {
    this.mapCreator.set(type, handler);
    return this;
  }

  build(defaultHandler: FormulaControllerFactory): FormulaControllerFactoryResolver {
    return new FormulaControllerFactoryResolver(this.mapCreator, defaultHandler);
  }
}
