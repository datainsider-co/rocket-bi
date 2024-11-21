import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getRedshiftSyntax } from '@/shared/fomula/builder/impl/redshift/RedshiftSyntax';
import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';

export class RedshiftFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getRedshiftSyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const redshiftSyntax = getRedshiftSyntax();
    return new MonacoFormulaControllerImpl(allFunctions, databaseSchemas, redshiftSyntax.languageConfiguration as any, redshiftSyntax.monarchLanguage as any);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const redshiftSyntax = getRedshiftSyntax();
    return new CalculatedFieldController(allFunctions, columns, redshiftSyntax.monarchLanguage as any);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const redshiftSyntax = getRedshiftSyntax();
    return new MeasureController(allFunctions, tblSchema, redshiftSyntax.monarchLanguage as any);
  }
}
