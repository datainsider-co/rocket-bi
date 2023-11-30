import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';

export abstract class FormulaControllerFactory {
  abstract getSupportedFunctionInfo(): SupportedFunctionInfo;

  abstract createFormulaController(functionInfoList: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController;

  abstract createCalculatedFieldController(functionInfoList: FunctionInfo[], columns: Column[]): MonacoFormulaController;

  abstract createMeasureFieldController(functionInfoList: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController;
}
