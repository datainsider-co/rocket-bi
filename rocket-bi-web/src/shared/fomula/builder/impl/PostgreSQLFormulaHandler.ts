import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { PostgreSQLFormulaController } from '@/shared/fomula/postgresql/PostgreSQLFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';

export class PostgreSQLFormulaHandler extends FormulaCreatorHandler {
  createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    return new PostgreSQLFormulaController(allFunctions, databaseSchemas);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    return new CalculatedFieldController(allFunctions, columns);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    return new MeasureController(allFunctions, tblSchema);
  }

  getSyntaxFile(): string {
    return 'postgresql-syntax.json';
  }
}
