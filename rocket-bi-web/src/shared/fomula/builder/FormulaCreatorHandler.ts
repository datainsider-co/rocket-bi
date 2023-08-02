import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';

export abstract class FormulaCreatorHandler {
  abstract getSyntaxFile(): string;

  abstract createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController;

  abstract createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController;

  abstract createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController;
}
