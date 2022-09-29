/*
 * @author: tvc12 - Thien Vi
 * @created: 10/22/21, 1:42 PM
 */

import { CancellationToken, editor, languages, Position, Token } from 'monaco-editor';
import { Log } from '@core/utils';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { Column, DatabaseSchema, TableSchema } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import CompletionItemProvider = languages.CompletionItemProvider;

export class TokenInfo {
  databases: Set<string>;
  tables: Set<string>;
  columns: Set<string>;

  constructor() {
    this.databases = new Set<string>();
    this.tables = new Set<string>();
    this.columns = new Set<string>();
  }

  addDatabase(database: string) {
    this.databases.add(database);
  }

  addTable(table: string) {
    this.tables.add(table);
  }

  addColumn(column: string) {
    this.columns.add(column);
  }
}

export enum KeywordType {
  Keyword = 'keyword',
  Database = 'database',
  Table = 'table',
  Column = 'column'
}

export class ClickHouseCompletionItemProvider implements CompletionItemProvider {
  public triggerCharacters?: string[];
  private allColumnsNames: Set<string>;
  private allTableNames: Set<string>;
  private allDatabaseSchemas: Set<string>;
  private readonly databaseSchemas: DatabaseSchema[];
  private readonly allTables: TableSchema[];
  private readonly allColumns: Column[];
  private readonly language: string;
  private readonly allFunctions: FunctionInfo[];

  constructor(props: {
    allColumnsNames: Set<string>;
    allTableNames: Set<string>;
    allDatabaseSchemas: Set<string>;
    defaultSuggestions: languages.CompletionItem[];
    triggerCharacters?: string[];
    databaseSchemas: DatabaseSchema[];
    allTables: TableSchema[];
    allColumns: Column[];
    language: string;
    allFunctions: FunctionInfo[];
  }) {
    this.allColumnsNames = props.allColumnsNames;
    this.allTableNames = props.allTableNames;
    this.allDatabaseSchemas = props.allDatabaseSchemas;
    this.allFunctions = props.allFunctions;
    this.triggerCharacters = props.triggerCharacters;
    this.databaseSchemas = props.databaseSchemas;
    this.allTables = props.allTables;
    this.allColumns = props.allColumns;
    this.language = props.language;
  }

  provideCompletionItems(
    model: editor.ITextModel,
    position: Position,
    context: languages.CompletionContext,
    token: CancellationToken
  ): languages.ProviderResult<languages.CompletionList> {
    const tokenInfo: TokenInfo = FormulaUtils.getTokenInfo(model, this.language);

    if (FormulaUtils.isTriggers(context, ['.']) || FormulaUtils.canSuggestionExact(model.getValue(), position)) {
      Log.debug('provideCompletionItems::custom');
      const keyword = FormulaUtils.findNearestKeyword(model.getValue(), position, '\\b\\w+(?=\\.)\\b');
      Log.debug('provideCompletionItems::', keyword);
      if (keyword) {
        return this.suggestionByKeyword(keyword, tokenInfo);
      } else {
        return this.suggestDefault(tokenInfo);
      }
    } else {
      Log.debug('provideCompletionItems::default');
      return this.suggestDefault(tokenInfo);
    }
  }

  private suggestionByKeyword(keyword: string, tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    const keywordType: KeywordType = this.getKeyWordType(keyword);
    Log.debug('suggestionByKeyword::', keywordType);
    switch (keywordType) {
      case KeywordType.Column:
        // ignore suggest,end of syntax
        return { suggestions: [] };
      case KeywordType.Table:
        // suggest next column
        return this.suggestionColumns(keyword, tokenInfo);
      case KeywordType.Database:
        // suggest next table
        return this.suggestionTables(keyword);
      default:
        return this.suggestDefault(tokenInfo);
    }
  }

  private suggestDefault(tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    // remove reference for show suggestion immediately
    Log.debug('suggestDefault::', tokenInfo);
    const defaultSuggestions: languages.CompletionItem[] = [
      ...this.getCompletionColumns(tokenInfo.databases, tokenInfo.tables),
      ...this.getCompletionTables(tokenInfo.databases, tokenInfo.tables),
      ...FormulaUtils.createSuggestionDatabaseData(this.databaseSchemas),
      ...FormulaUtils.createSuggestKeywords(this.allFunctions)
    ];
    return { suggestions: defaultSuggestions };
  }

  private isTriggers(context: any, triggers: string[]): boolean {
    const isCharacterTrigger = context.triggerKind == languages.CompletionTriggerKind.TriggerCharacter;
    const isTriggerExisted = triggers.some(trigger => trigger == context.triggerCharacter);
    Log.debug('isTriggers::', isCharacterTrigger, isTriggerExisted);
    return isCharacterTrigger && isTriggerExisted;
  }

  private canSuggestionExact(code: string, position: any): boolean {
    const currentCode = FormulaUtils.getCorrectLineOfCode(code, position);
    Log.debug('canSuggestionExact::', currentCode);
    return !!currentCode.match(RegExp(/\w+\.\s*$/, 'gm'));
  }

  private findTableSchemas(allTables: TableSchema[], keyword: string, tokenInfo: TokenInfo): TableSchema[] {
    const tableSchemas: TableSchema[] = [];
    const tablesInQueryAsMap: Map<string, TableSchema[]> = this.getTableAsMap(this.allTables, tokenInfo.databases, new Set([keyword]));
    tablesInQueryAsMap.forEach((tables, key) => {
      tableSchemas.push(...tables);
    });
    return tableSchemas;
  }

  private suggestionColumns(keyword: string, tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    const tableSchemas: TableSchema[] = this.findTableSchemas(this.allTables, keyword, tokenInfo);
    const completionItems: languages.CompletionItem[] = [];
    tableSchemas.forEach(tableSchema => {
      const items: languages.CompletionItem[] = FormulaUtils.createSuggestionColumnData(
        tableSchema.columns,
        tableSchema.dbName,
        FormulaUtils.getTableDisplayName(tableSchema)
      );
      completionItems.push(...items);
    });
    return {
      suggestions: completionItems
    };
  }

  private suggestionTables(keyword: string): languages.ProviderResult<languages.CompletionList> {
    const database: DatabaseSchema | undefined = this.databaseSchemas.find(database => database.name == keyword);
    if (database) {
      const dbDisplayName = FormulaUtils.getDbDisplayName(database);
      const suggestions = FormulaUtils.createSuggestionTableData(database.tables, dbDisplayName);
      return { suggestions: suggestions };
    } else {
      return {
        suggestions: []
      };
    }
  }

  // TODO: improve here set in here
  private getKeyWordType(keyword: string): KeywordType {
    if (this.allDatabaseSchemas.has(keyword)) {
      return KeywordType.Database;
    }
    if (this.allTableNames.has(keyword)) {
      return KeywordType.Table;
    }
    if (this.allColumnsNames.has(keyword)) {
      return KeywordType.Column;
    }
    return KeywordType.Keyword;
  }

  private getCompletionTables(dbNames: Set<string>, tableNames: Set<string>): languages.CompletionItem[] {
    const tableSchemaAsMap = this.getTableAsMap(this.allTables, dbNames, tableNames);
    Log.debug('getCompletionTables::', tableSchemaAsMap);
    const completionItems: languages.CompletionItem[] = [];
    tableSchemaAsMap.forEach((tableSchemas: TableSchema[], key: string) => {
      completionItems.push(...FormulaUtils.createSuggestionTableData(tableSchemas, key));
    });
    return completionItems;
  }

  /**
   * Group by key: dbName, value: TableSchema[]
   */
  private getTableAsMap(allTables: TableSchema[], databaseNames: Set<string>, tableNames: Set<string>) {
    const tableSchemaAsMap = new Map<string, TableSchema[]>();
    allTables
      .filter(table => tableNames.has(table.name) && databaseNames.has(table.dbName))
      .forEach(table => {
        if (tableSchemaAsMap.has(table.dbName)) {
          const items = tableSchemaAsMap.get(table.dbName) ?? [];
          items.push(table);
        } else {
          tableSchemaAsMap.set(table.dbName, [table]);
        }
      });
    return tableSchemaAsMap;
  }

  private getCompletionColumns(databaseNames: Set<string>, tableNames: Set<string>): languages.CompletionItem[] {
    const tableSchemaAsMap: Map<string, TableSchema[]> = this.getTableAsMap(this.allTables, databaseNames, tableNames);
    const completionItems: languages.CompletionItem[] = [];
    tableSchemaAsMap.forEach((tableSchemas, dbName) => {
      const items: languages.CompletionItem[] = tableSchemas.flatMap(table =>
        FormulaUtils.createSuggestionColumnData(table.columns, dbName, FormulaUtils.getTableDisplayName(table))
      );
      completionItems.push(...items);
    });
    return completionItems;
  }
}
