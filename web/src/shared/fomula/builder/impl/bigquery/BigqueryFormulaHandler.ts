import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getBigquerySyntax } from '@/shared/fomula/builder/impl/bigquery/BigquerySyntax.ts';

import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';
import { languages } from 'monaco-editor';
import LanguageConfiguration = languages.LanguageConfiguration;
import IMonarchLanguage = languages.IMonarchLanguage;

export class BigqueryFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getBigquerySyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const bigquerySyntax = getBigquerySyntax();
    const languageConfiguration = (bigquerySyntax.languageConfiguration as any) as LanguageConfiguration;
    const monarchLanguage = (bigquerySyntax.monarchLanguage as any) as IMonarchLanguage;

    return new MonacoFormulaControllerImpl(allFunctions, databaseSchemas, languageConfiguration, monarchLanguage);
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const monarchLanguage = (getBigquerySyntax().monarchLanguage as any) as IMonarchLanguage;
    return new CalculatedFieldController(allFunctions, columns, monarchLanguage);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const monarchLanguage = (getBigquerySyntax().monarchLanguage as any) as IMonarchLanguage;
    return new MeasureController(allFunctions, tblSchema, monarchLanguage);
  }
}
