import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { MySQLLanguage, MySQLLanguageConfig } from '@/shared/fomula/mysql/MySQLLanguageTokenizer';
import { Log } from '@core/utils';

export class MySQLFormulaController extends QueryFormulaController {
  formulaName(): string {
    return 'mysql';
  }

  protected loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), MySQLLanguageConfig);
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...MySQLLanguage,
      keywords: this.allFunctions.map(func => func.name),
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }
}
