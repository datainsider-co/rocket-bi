import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { PostgreSQLLanguage, PostgreSQLLanguageConfig } from '@/shared/fomula/postgresql/PostgreSQLLanguageTokenizer';

export class PostgreSQLFormulaController extends QueryFormulaController {
  formulaName(): string {
    return 'postgresql';
  }

  protected loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), PostgreSQLLanguageConfig);
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...PostgreSQLLanguage,
      keywords: this.allFunctions.map(func => func.name),
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }
}
