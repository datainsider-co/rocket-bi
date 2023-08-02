import { BigqueryFormulaController } from '@/shared/fomula/bigquery/BigqueryFormulaController';
import { BigqueryLanguage } from '@/shared/fomula/bigquery/BigqueryLanguageTokenizer';
import { Column } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class BigqueryCalculatedFieldController extends BigqueryFormulaController {
  columns: Column[];

  constructor(allFunctions: FunctionInfo[], columns: Column[]) {
    super(allFunctions, []);
    this.columns = columns;
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...BigqueryLanguage,
      fields: this.fieldNames()
    } as IMonarchLanguage);
  }

  private fieldNames(): string[] {
    return this.columns.map(col => col.displayName);
  }
}
