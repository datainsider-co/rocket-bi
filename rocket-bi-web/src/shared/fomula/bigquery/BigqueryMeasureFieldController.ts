import { BigqueryFormulaController } from '@/shared/fomula/bigquery/BigqueryFormulaController';
import { BigqueryLanguage } from '@/shared/fomula/bigquery/BigqueryLanguageTokenizer';
import { TableSchema } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class BigqueryMeasureFieldController extends BigqueryFormulaController {
  tableSchema: TableSchema;

  constructor(allFunctions: FunctionInfo[], tableSchema: TableSchema) {
    super(allFunctions, []);
    this.tableSchema = tableSchema;
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...BigqueryLanguage,
      fields: this.fieldNames()
    } as IMonarchLanguage);
  }

  private fieldNames(): string[] {
    return this.tableSchema.columns.map(col => col.displayName);
  }
}
