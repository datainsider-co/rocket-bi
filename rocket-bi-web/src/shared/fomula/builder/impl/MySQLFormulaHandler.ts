import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { MySQLFormulaController } from '@/shared/fomula/mysql/MySQLFormulaController';
import { MySQLCalculatedFieldController } from '@/shared/fomula/mysql/MySQLCalculatedFieldController';
import { MySQLMeasureFieldController } from '@/shared/fomula/mysql/MySQLMeasureFieldController';

export class MySQLFormulaHandler extends FormulaCreatorHandler {
  createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    return new MySQLFormulaController(allFunctions, databaseSchemas);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    return new MySQLCalculatedFieldController(allFunctions, columns);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    return new MySQLMeasureFieldController(allFunctions, tblSchema);
  }

  getSyntaxFile(): string {
    return 'mysql-syntax.json';
  }
}
