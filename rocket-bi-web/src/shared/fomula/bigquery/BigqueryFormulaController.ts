import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { BigqueryLanguage, BigqueryLanguageConfig } from '@/shared/fomula/bigquery/BigqueryLanguageTokenizer';
import { Log } from '@core/utils';

export class BigqueryFormulaController extends QueryFormulaController {
  formulaName(): string {
    return 'bigquery';
  }

  protected loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), BigqueryLanguageConfig);
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...BigqueryLanguage,
      keywords: this.allFunctions.map(func => func.name),
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }
}
