import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getVerticaSyntax } from '@/shared/fomula/builder/impl/vertica/VerticaSyntax';
import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';

export class VerticaFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getVerticaSyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const verticaSyntax = getVerticaSyntax();
    return new MonacoFormulaControllerImpl(allFunctions, databaseSchemas, verticaSyntax.languageConfiguration as any, verticaSyntax.monarchLanguage as any);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const verticaSyntax = getVerticaSyntax();
    return new CalculatedFieldController(allFunctions, columns, verticaSyntax.monarchLanguage as any);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const verticaSyntax = getVerticaSyntax();
    return new MeasureController(allFunctions, tblSchema, verticaSyntax.monarchLanguage as any);
  }
}
