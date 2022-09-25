import { Column, DatabaseSchema, TableSchema } from '@core/domain/Model';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { FunctionInfo } from '@/screens/ChartBuilder/ConfigBuilder/DatabaseListing/FormulaSuggestionStore';
import { SQLConfig } from '@/shared/fomula/ClickHouse/LanguageConfig';
import { BaseSqlLanguage } from '@/shared/fomula/ClickHouse/LanguageTokenizer';
import { ClickHouseCompletionItemProvider } from '@/shared/fomula/ClickHouse/ClickHouseCompletionItemProvider';
import { editor, languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class QueryFormulaController implements FormulaController {
  protected languageRegister: any | null = null;
  protected tokensProvider: any | null = null;
  private editor?: typeof editor = void 0;

  private readonly allFunctions: FunctionInfo[];
  private readonly databaseSchemas: DatabaseSchema[];

  private allTables: TableSchema[];
  private allColumns: Column[];

  private allColumnsNames: Set<string>;
  private allTableNames: Set<string>;
  private allDatabaseSchemas: Set<string>;

  constructor(allFunctions: FunctionInfo[], databaseSchemas: DatabaseSchema[] = []) {
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

  private loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), SQLConfig);
  }

  private initLanguage(monaco: any) {
    monaco.languages.register({ id: this.formulaName() });
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  private loadTokenProvider(monaco: any) {
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
      new ClickHouseCompletionItemProvider({
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
