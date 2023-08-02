import { FormulaCreatorHandler } from '@/shared/fomula/builder/FormulaCreatorHandler';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { ClickhouseCalculatedFieldController } from '@/shared/fomula/ClickhouseCalculatedFieldController';
import { ClickhouseMeasureController } from '@/shared/fomula/ClickhouseMeasureController';

export class ClickhouseFormulaHandler extends FormulaCreatorHandler {
  createController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): FormulaController {
    return new QueryFormulaController(allFunctions, databaseSchemas);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): FormulaController {
    return new ClickhouseCalculatedFieldController(allFunctions, columns);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): FormulaController {
    return new ClickhouseMeasureController(allFunctions, tblSchema);
  }

  getSyntaxFile(): string {
    return 'clickhouse-syntax.json';
  }
}
