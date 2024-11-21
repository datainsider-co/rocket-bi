import { ConnectorType } from '@core/connector-config';
import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';

export class FormulaControllerFactoryResolver {
  private readonly creatorMap: Map<ConnectorType, FormulaControllerFactory>;

  private readonly defaultCreator: FormulaControllerFactory;

  constructor(handlerMap: Map<ConnectorType, FormulaControllerFactory>, defaultHandler: FormulaControllerFactory) {
    this.creatorMap = handlerMap;
    this.defaultCreator = defaultHandler;
  }

  resolve(type: ConnectorType): FormulaControllerFactory {
    return this.creatorMap.get(type) ?? this.defaultCreator;
  }
}
