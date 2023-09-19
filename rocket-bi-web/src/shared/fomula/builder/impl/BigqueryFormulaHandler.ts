import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { BigqueryFormulaController } from '@/shared/fomula/bigquery/BigqueryFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';

export class BigqueryFormulaHandler extends FormulaCreatorHandler {
  createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    return new BigqueryFormulaController(allFunctions, databaseSchemas);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    return new CalculatedFieldController(allFunctions, columns);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    return new MeasureController(allFunctions, tblSchema);
  }

  getSyntaxFile(): string {
    return 'bigquery-syntax.json';
  }
}
