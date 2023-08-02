import { Column, DatabaseInfo, TableSchema } from '@core/common/domain/model';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { SQLConfig } from '@/shared/fomula/clickhouse/LanguageConfig';
import { BaseSqlLanguage } from '@/shared/fomula/clickhouse/LanguageTokenizer';
import { ClickHouseCompletionItemProvider } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProvider';
import { editor, languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;
import { ClickHouseCompletionItemProviderV2 } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProviderV2';

export class QueryFormulaController implements FormulaController {
  protected languageRegister: any | null = null;
  protected tokensProvider: any | null = null;
  private editor?: typeof editor = void 0;

  protected readonly allFunctions: FunctionInfo[];
  protected readonly databaseSchemas: DatabaseInfo[];

  protected allTables: TableSchema[];
  protected allColumns: Column[];

  protected allColumnsNames: Set<string>;
  protected allTableNames: Set<string>;
  protected allDatabaseSchemas: Set<string>;

  constructor(allFunctions: FunctionInfo[], databaseSchemas: DatabaseInfo[] = []) {
    this.allFunctions = allFunctions;
    this.databaseSchemas = databaseSchemas;
    this.allDatabaseSchemas = new Set<string>(this.databaseSchemas.map(database => database.name));

    this.allTables = databaseSchemas.flatMap(database => database.tables);
    this.allTableNames = new Set<string>(this.allTables.map(table => table.name));

    this.allColumns = this.allTables.flatMap(table => table.columns);
    this.allColumnsNames = new Set<string>(this.allColumns.map(column => column.name));
  }

  formulaName(): string {
    return 'di-query';
  }

  getTheme(themeType: 'light' | 'dark' | 'custom'): string {
    return `query-theme-${themeType}`;
  }

  init(monaco: any): void {
    this.initLanguage(monaco);
    this.loadConfig(monaco);
    this.loadTokenProvider(monaco);
    this.loadSuggestion(monaco);
  }

  dispose(): void {
    this.languageRegister?.dispose();
    this.tokensProvider?.dispose();
  }

  protected loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), SQLConfig);
  }

  private initLanguage(monaco: any) {
    monaco.languages.register({ id: this.formulaName() });
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  protected loadTokenProvider(monaco: any) {
    this.tokensProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...BaseSqlLanguage,
      keywords: this.allFunctions.map(func => func.name),
      databases: this.getSuggestDatabaseNames(),
      tables: Array.from(this.allTableNames),
      columns: Array.from(this.allColumnsNames)
    } as IMonarchLanguage);
  }

  protected loadSuggestion(monaco: any) {
    this.languageRegister = monaco.languages.registerCompletionItemProvider(
      this.formulaName(),
      new ClickHouseCompletionItemProviderV2({
        ...this,
        language: this.formulaName(),
        triggerCharacters: ['.', '(', ',', '`', '[', ' ']
      } as any)
    );
  }

  protected getSuggestDatabaseNames() {
    return Array.from(this.allDatabaseSchemas);
  }
}
