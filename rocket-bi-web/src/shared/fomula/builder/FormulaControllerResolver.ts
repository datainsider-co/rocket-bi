import { DataSourceType } from '@core/clickhouse-config';
import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { Column, DatabaseInfo, TableSchema, UnsupportedException } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { FormulaController } from '@/shared/fomula/FormulaController';

export class FormulaControllerResolver {
  private mapCreator: Map<DataSourceType, FormulaCreatorHandler>;

  private defaultCreatorHandler: FormulaCreatorHandler;

  constructor(mapCreator: Map<DataSourceType, FormulaCreatorHandler>, defaultCreatorHandler: FormulaCreatorHandler) {
    this.mapCreator = mapCreator;
    this.defaultCreatorHandler = defaultCreatorHandler;
  }

  createController(type: DataSourceType, allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createController(allFunctions, databaseSchemas);
    } else {
      return this.defaultCreatorHandler.createController(allFunctions, databaseSchemas);
    }
  }

  createCalculatedFieldController(type: DataSourceType, allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createCalculatedFieldController(allFunctions, columns);
    }
    return this.defaultCreatorHandler.createCalculatedFieldController(allFunctions, columns);
  }

  createMeasurementController(type: DataSourceType, allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.createMeasureFieldController(allFunctions, tblSchema);
    } else {
      return this.defaultCreatorHandler.createMeasureFieldController(allFunctions, tblSchema);
    }
  }

  getSyntax(type: DataSourceType): string {
    if (this.mapCreator.has(type)) {
      return this.mapCreator.get(type)!.getSyntaxFile();
    } else {
      return this.defaultCreatorHandler.getSyntaxFile();
    }
  }
}
