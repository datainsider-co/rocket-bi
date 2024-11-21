import { Column, DatabaseInfo, TableSchema } from '@core/common/domain/model';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { languages, IDisposable } from 'monaco-editor';
import { DiCompletionItemProvider } from '@/shared/fomula/DiCompletionItemProvider';
import IMonarchLanguage = languages.IMonarchLanguage;

export class MonacoFormulaControllerImpl implements MonacoFormulaController {
  private languageRegisterProvider: IDisposable | null = null;
  private monarchTokenProvider: IDisposable | null = null;
  private readonly languageConfig: languages.LanguageConfiguration;
  private readonly monarchLanguage: IMonarchLanguage;

  protected readonly functionInfoList: FunctionInfo[];
  protected readonly databaseSchemas: DatabaseInfo[];

  protected readonly tableList: TableSchema[];
  protected readonly columnList: Column[];

  protected readonly columnsNameList: Set<string>;
  protected readonly tableNameList: Set<string>;
  protected readonly databaseSchemaList: Set<string>;
  constructor(
    functionInfoList: FunctionInfo[],
    databaseSchemas: DatabaseInfo[] = [],
    languageConfig: languages.LanguageConfiguration,
    monarchLanguage: IMonarchLanguage
  ) {
    this.functionInfoList = functionInfoList;
    this.databaseSchemas = databaseSchemas;
    this.languageConfig = languageConfig;
    this.monarchLanguage = monarchLanguage;
    this.databaseSchemaList = new Set<string>(this.databaseSchemas.map(database => database.name));

    this.tableList = databaseSchemas.flatMap(database => database.tables);
    this.tableNameList = new Set<string>(this.tableList.map(table => table.name));

    this.columnList = this.tableList.flatMap(table => table.columns);
    this.columnsNameList = new Set<string>(this.columnList.map(column => column.name));
  }

  formulaName(): string {
    return 'di-formula-syntax';
  }

  getTheme(): string {
    return 'query-theme-light';
  }

  init(monaco: any): void {
    this.initLanguage(monaco);
    this.loadConfig(monaco);
    this.loadTokenProvider(monaco);
    this.loadSuggestion(monaco);
  }

  dispose(): void {
    this.languageRegisterProvider?.dispose();
    this.monarchTokenProvider?.dispose();
  }

  private initLanguage(monaco: any) {
    monaco.languages.register({ id: this.formulaName() });
  }

  private loadConfig(monaco: any) {
    monaco.languages.setLanguageConfiguration(this.formulaName(), this.languageConfig);
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  private loadTokenProvider(monaco: any): void {
    this.monarchTokenProvider = monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...this.monarchLanguage,
      keywords: this.functionInfoList.map(func => func.name),
      databases: Array.from(this.databaseSchemaList),
      tables: Array.from(this.tableNameList),
      columns: Array.from(this.columnsNameList)
    } as IMonarchLanguage);
  }

  private loadSuggestion(monaco: any) {
    this.languageRegisterProvider = monaco.languages.registerCompletionItemProvider(
      this.formulaName(),
      new DiCompletionItemProvider({
        allFunctions: this.functionInfoList,
        language: this.formulaName(),
        triggerCharacters: ['.', '(', ',', '`', '[', ' '],
        databaseSchemas: this.databaseSchemas
      })
    );
  }
}
