import { ConnectorType } from '@core/connector-config';
import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { Column, DatabaseInfo, TableSchema, UnsupportedException } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { FormulaController } from '@/shared/fomula/FormulaController';

export class FormulaControllerResolver {
  private mapCreator: Map<ConnectorType, FormulaCreatorHandler>;

  private defaultCreatorHandler: FormulaCreatorHandler;

  constructor(mapCreator: Map<ConnectorType, FormulaCreatorHandler>, defaultCreatorHandler: FormulaCreatorHandler) {
    this.mapCreator = mapCreator;
    this.defaultCreatorHandler = defaultCreatorHandler;
  }

  createController(type: ConnectorType, allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createController(allFunctions, databaseSchemas);
    } else {
      return this.defaultCreatorHandler.createController(allFunctions, databaseSchemas);
    }
  }

  createCalculatedFieldController(type: ConnectorType, allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createCalculatedFieldController(allFunctions, columns);
    }
    return this.defaultCreatorHandler.createCalculatedFieldController(allFunctions, columns);
  }

  createMeasurementController(type: ConnectorType, allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createMeasureFieldController(allFunctions, tblSchema);
    } else {
      return this.defaultCreatorHandler.createMeasureFieldController(allFunctions, tblSchema);
    }
  }

  getSyntax(type: ConnectorType): string {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.getSyntaxFile();
    } else {
      return this.defaultCreatorHandler.getSyntaxFile();
    }
  }
}
