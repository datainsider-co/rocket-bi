import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getPostgresqlSyntax } from '@/shared/fomula/builder/impl/postgresql/PostgresqlSyntax';
import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';

export class PostgreSQLFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getPostgresqlSyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const postgresql = getPostgresqlSyntax();
    return new MonacoFormulaControllerImpl(allFunctions, databaseSchemas, postgresql.languageConfiguration as any, postgresql.monarchLanguage as any);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const postgresql = getPostgresqlSyntax();
    return new CalculatedFieldController(allFunctions, columns, postgresql.monarchLanguage as any);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const postgresql = getPostgresqlSyntax();
    return new MeasureController(allFunctions, tblSchema, postgresql.monarchLanguage as any);
  }
}
