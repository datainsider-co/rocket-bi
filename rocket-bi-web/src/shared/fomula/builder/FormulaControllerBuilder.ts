import { ConnectorType } from '@core/connector-config';
import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FormulaControllerResolver } from '@/shared/fomula/builder/FormulaControllerResolver';
import { ClassNotFound } from '@core/common/domain';
import { Log } from '@core/utils';

export class FormulaControllerResolverBuilder {
  private mapCreator: Map<ConnectorType, FormulaCreatorHandler> = new Map();
  private defaultCreatorHandler: FormulaCreatorHandler | null = null;

  add(type: ConnectorType, handler: FormulaCreatorHandler): FormulaControllerResolverBuilder {
    this.mapCreator.set(type, handler);
    return this;
  }

  addDefault(handler: FormulaCreatorHandler): FormulaControllerResolverBuilder {
    this.defaultCreatorHandler = handler;
    return this;
  }

  build(): FormulaControllerResolver {
    if (!this.defaultCreatorHandler) {
      Log.error('FormulaControllerResolverBuilder::build:: defaultCreatorHandler is required!');
      throw new ClassNotFound('');
    }
    return new FormulaControllerResolver(this.mapCreator, this.defaultCreatorHandler);
  }
}
