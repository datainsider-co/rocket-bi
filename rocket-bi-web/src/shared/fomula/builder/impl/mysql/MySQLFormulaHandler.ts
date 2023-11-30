import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getMysqlSyntax } from '@/shared/fomula/builder/impl/mysql/MysqlSyntax';
import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';

export class MySQLFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getMysqlSyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const mysqlSyntax = getMysqlSyntax();
    return new MonacoFormulaControllerImpl(allFunctions, databaseSchemas, mysqlSyntax.languageConfiguration as any, mysqlSyntax.monarchLanguage as any);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const mysqlSyntax = getMysqlSyntax();
    return new CalculatedFieldController(allFunctions, columns, mysqlSyntax.monarchLanguage as any);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const mysqlSyntax = getMysqlSyntax();
    return new MeasureController(allFunctions, tblSchema, mysqlSyntax.monarchLanguage as any);
  }
}
