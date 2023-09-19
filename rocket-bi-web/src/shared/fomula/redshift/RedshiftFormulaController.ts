import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { QueryFormulaController } from '@/shared/fomula/QueryFormulaController';
import { RedshiftLanguage, RedshiftLanguageConfig } from '@/shared/fomula/redshift/RedshiftLanguageTokenizer';

export class RedshiftFormulaController extends QueryFormulaController {
  formulaName(): string {
    return 'redshift';
  }

  protected loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), RedshiftLanguageConfig);
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...RedshiftLanguage,
      keywords: this.allFunctions.map(func => func.name),
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }
}
