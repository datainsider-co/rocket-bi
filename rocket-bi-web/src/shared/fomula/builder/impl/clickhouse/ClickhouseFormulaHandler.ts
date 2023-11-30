import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { FunctionInfo, SupportedFunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { MonacoFormulaControllerImpl } from '@/shared/fomula/MonacoFormulaControllerImpl';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { getClickhouseSyntax } from '@/shared/fomula/builder/impl/clickhouse/ClickhouseSyntax';

export class ClickhouseFormulaHandler extends FormulaControllerFactory {
  getSupportedFunctionInfo(): SupportedFunctionInfo {
    return (getClickhouseSyntax().supportedFunction as any) as SupportedFunctionInfo;
  }

  createFormulaController(functionInfoList: FunctionInfo[], databaseSchemas: DatabaseInfo[]): MonacoFormulaController {
    const clickhouseSyntax = getClickhouseSyntax();
    return new MonacoFormulaControllerImpl(
      functionInfoList,
      databaseSchemas,
      clickhouseSyntax.languageConfiguration as any,
      clickhouseSyntax.monarchLanguage as any
    );
  }

  createCalculatedFieldController(allFunctions: FunctionInfo[], columns: Column[]): MonacoFormulaController {
    const clickhouseSyntax = getClickhouseSyntax();
    return new CalculatedFieldController(allFunctions, columns, clickhouseSyntax.monarchLanguage as any);
  }

  createMeasureFieldController(allFunctions: FunctionInfo[], tblSchema: TableSchema): MonacoFormulaController {
    const clickhouseSyntax = getClickhouseSyntax();
    return new MeasureController(allFunctions, tblSchema, clickhouseSyntax.monarchLanguage as any);
  }
}
