/*
 * @author: tvc12 - Thien Vi
 * @created: 11/17/21, 1:52 PM
 */

import { FormulaController } from '@/shared/fomula/FormulaController';
import { SparkLanguage, SparkLanguageConfig } from '@/shared/fomula/spark/LanguageTokenizer';
import { languages } from 'monaco-editor';
import { SparkCompletionItemProvider } from '@/shared/fomula/spark/SparkCompletionItemProvider';
import IMonarchLanguage = languages.IMonarchLanguage;
import { Log } from '@core/utils';
import { TableInfo } from '@core/lake-house';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';

export class SparkFormulaController implements FormulaController {
  protected languageRegister: any | null = null;
  protected tokensProvider: any | null = null;
  protected tables: TableInfo[];

  constructor(tables: TableInfo[]) {
    this.tables = tables;
  }

  formulaName(): string {
    return 'di-spark';
  }

  getTheme(themeType: 'light' | 'dark' | 'custom'): string {
    return `spark-theme-${themeType}`;
  }

  init(monaco: any): void {
    Log.debug('init::Spark Language');
    this.initLanguage(monaco);
    this.loadConfig(monaco);
    this.loadTokenProvider(monaco);
    this.loadSuggestion(monaco);
  }

  dispose(): void {
    this.languageRegister?.dispose();
    this.tokensProvider?.dispose();
  }

  protected loadSuggestion(monaco: any) {
    this.languageRegister = monaco.languages.registerCompletionItemProvider(
      this.formulaName(),
      new SparkCompletionItemProvider(this.tables, this.formulaName(), ['.', ' ', '@'])
    );
  }

  private loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), SparkLanguageConfig);
  }

  private initLanguage(monaco: any) {
    monaco.languages.register({ id: this.formulaName() });
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  private loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...SparkLanguage,
      tables: this.tables.map(table => table.tableName),
      columns: FormulaUtils.getAllColumns(this.tables)
    } as IMonarchLanguage);
  }
}
