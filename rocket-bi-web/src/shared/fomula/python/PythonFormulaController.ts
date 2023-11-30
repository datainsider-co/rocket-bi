/*
 * @author: tvc12 - Thien Vi
 * @created: 11/17/21, 1:52 PM
 */

import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { Log } from '@core/utils';
import { PythonCompletionItemProvider } from '@/shared/fomula/python/PythonCompletionItemProvider';
import { PythonLanguage, PythonLanguageConfig } from '@/shared/fomula/python/PythonLanguageTokenizer';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';

export class PythonFormulaController implements MonacoFormulaController {
  protected languageRegister: any | null = null;
  protected tokensProvider: any | null = null;
  private readonly databaseSchemas: DatabaseInfo[];
  private allTables: TableSchema[];
  private allColumns: Column[];

  private allColumnsNames: Set<string>;
  private allTableNames: Set<string>;
  private allDatabaseSchemas: Set<string>;

  constructor(databaseSchemas: DatabaseInfo[] = []) {
    this.databaseSchemas = databaseSchemas;
    this.allDatabaseSchemas = new Set<string>(this.databaseSchemas.map(database => database.name));

    this.allTables = databaseSchemas.flatMap(database => database.tables);
    this.allTableNames = new Set<string>(this.allTables.map(table => table.name));

    this.allColumns = this.allTables.flatMap(table => table.columns);
    this.allColumnsNames = new Set<string>(this.allColumns.map(column => column.name));
  }

  formulaName(): string {
    return 'python';
  }

  getTheme(): string {
    return `spark-theme-light`;
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
      new PythonCompletionItemProvider(this.allTables, this.formulaName(), ['.', ' ', '@'])
    );
  }

  private loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), PythonLanguageConfig);
  }

  private initLanguage(monaco: any) {
    monaco.languages.register({ id: this.formulaName() });
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  private loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...PythonLanguage,
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }

  protected getSuggestDatabaseNames() {
    return Array.from(this.allDatabaseSchemas);
  }
}
