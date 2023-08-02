import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { BigqueryFormulaController } from '@/shared/fomula/bigquery/BigqueryFormulaController';
import { BigqueryCalculatedFieldController } from '@/shared/fomula/bigquery/BigqueryCalculatedFieldController';
import { BigqueryMeasureFieldController } from '@/shared/fomula/bigquery/BigqueryMeasureFieldController';

export class BigqueryFormulaHandler extends FormulaCreatorHandler {
  createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    return new BigqueryFormulaController(allFunctions, databaseSchemas);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    return new BigqueryCalculatedFieldController(allFunctions, columns);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    return new BigqueryMeasureFieldController(allFunctions, tblSchema);
  }

  getSyntaxFile(): string {
    return 'bigquery-syntax.json';
  }
}
