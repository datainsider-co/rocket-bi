import { CancellationToken, editor, languages, Position, Token } from 'monaco-editor';
import { Log } from '@core/utils';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { ListUtils, StringUtils } from '@/utils';
import { KeywordType, TokenInfo } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProvider';
import CompletionItemProvider = languages.CompletionItemProvider;

export class ClickHouseCompletionItemProviderV2 implements CompletionItemProvider {
  public triggerCharacters?: string[];
  private allColumnsNames: Set<string>;
  private allTableNames: Set<string>;
  private allDatabaseSchemas: Set<string>;
  private readonly databaseSchemas: DatabaseInfo[];
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
    databaseSchemas: DatabaseInfo[];
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
    const listTokens = FormulaUtils.getTokens(model.getValue(), this.language);
    Log.debug('provideCompletionItems::listToken::', listTokens);
    const { databaseMapTableSchema, databaseSchemaAsMap } = FormulaUtils.getDatabaseAsMapFromToken(listTokens, this.databaseSchemas, model, this.language);
    Log.debug('provideCompletionItems::databaseMapTableSchema::', databaseMapTableSchema, 'databaseSchemaAsMap::', databaseSchemaAsMap);
    if (FormulaUtils.isTriggers(context, ['.']) || FormulaUtils.canSuggestionExact(model.getValue(), position)) {
      Log.debug('provideCompletionItems::custom');
      const keyword = FormulaUtils.findNearestKeyword(model.getValue(), position, '\\b\\w+(?=\\.)\\b');
      Log.debug('provideCompletionItems::keyword::', keyword, position, listTokens);
      if (keyword) {
        return this.suggestionByKeyword(listTokens, position, keyword, databaseMapTableSchema);
      } else {
        return this.suggestDefault(databaseMapTableSchema, databaseSchemaAsMap);
      }
    } else {
      Log.debug('provideCompletionItems::default');
      return this.suggestDefault(databaseMapTableSchema, databaseSchemaAsMap);
    }
  }

  private getNearestKeywordType(listTokens: Token[][], cursorPosition: { column: number; lineNumber: number }): KeywordType {
    let keywordType = KeywordType.Identifier;
    const currentTokens = listTokens[cursorPosition.lineNumber - 1];
    for (let tokenIndex = currentTokens.length - 1; tokenIndex >= 0; tokenIndex--) {
      const currentToken = currentTokens[tokenIndex];
      Log.debug('nearestTokenType::currentToken::', currentToken, 'index::', tokenIndex);
      if (currentToken.offset === cursorPosition.column - 2) {
        Log.debug('nearestTokenType::matchCurrentCursor::', currentToken, 'index::', tokenIndex);
        for (let index = tokenIndex - 1; index > 0; index--) {
          keywordType = this.getKeyWordType(currentTokens[index].type);
          Log.debug('nearestTokenType::keywordType::', currentTokens[index], 'index::', index);
          if (keywordType !== KeywordType.Source) {
            break;
          }
        }
        if (keywordType !== KeywordType.Source) {
          break;
        }
      }
    }
    return keywordType;
  }

  private getKeyWordType(type: string): KeywordType {
    switch (type) {
      case `databases.${this.language}`: {
        return KeywordType.Database;
      }
      case `tables.${this.language}`: {
        return KeywordType.Table;
      }
      case `columns.${this.language}`: {
        return KeywordType.Column;
      }
      default: {
        return KeywordType.Identifier;
      }
    }
  }

  private suggestionByKeyword(
    listToken: Token[][],
    position: { column: number; lineNumber: number },
    keyword: string,
    databaseAsMap: Map<string, Record<string, TableSchema>>
  ): languages.ProviderResult<languages.CompletionList> {
    const nearestTokenType = this.getNearestKeywordType(listToken, position);
    Log.debug('suggestionByKeyword::nearestTokenType::', nearestTokenType);
    switch (nearestTokenType) {
      case KeywordType.Column:
        // ignore suggest,end of syntax
        return { suggestions: [] };
      case KeywordType.Table:
        // suggest next column
        return this.suggestionColumns(keyword, databaseAsMap);
      case KeywordType.Database:
        // suggest next table
        return this.suggestionTables(keyword);
      default:
      // return this.suggestDefault(tokenInfo);
    }
  }

  private suggestionColumns(
    keyword: string,
    databaseSchemaAsMap: Map<string, Record<string, TableSchema>>
  ): languages.ProviderResult<languages.CompletionList> {
    Log.debug('suggestionColumns::suggestionColumns::', keyword, databaseSchemaAsMap);
    const tableSchemas: TableSchema[] = this.findTableSchemas(keyword, databaseSchemaAsMap);
    Log.debug('suggestionColumns::tableSchemas::', tableSchemas);
    const completionItems: languages.CompletionItem[] = [];
    tableSchemas.forEach(tableSchema => {
      const items: languages.CompletionItem[] = FormulaUtils.createSuggestionColumnData(tableSchema.columns, tableSchema.dbName, tableSchema.name);
      completionItems.push(...items);
    });
    return {
      suggestions: completionItems
    };
  }

  private findTableSchemas(keyword: string, databaseSchemaAsMap: Map<string, Record<string, TableSchema>>): TableSchema[] {
    let tableSchemas: TableSchema[] = [];
    databaseSchemaAsMap.forEach((database, key) => {
      for (const [tableName, tableSchema] of Object.entries(database)) {
        if (StringUtils.isIncludes(keyword, tableName)) {
          tableSchemas = tableSchemas.concat(tableSchema);
        }
      }
    });
    return tableSchemas;
  }

  private suggestDefault(
    databaseMapTableSchema: Map<string, Record<string, TableSchema>>,
    databaseSchemaAsMap: Map<string, DatabaseInfo>
  ): languages.ProviderResult<languages.CompletionList> {
    // remove reference for show suggestion immediately
    Log.debug('suggestDefault::', databaseMapTableSchema);
    const defaultSuggestions: languages.CompletionItem[] = [
      ...this.getCompletionColumns(databaseMapTableSchema),
      ...this.getCompletionTables(databaseSchemaAsMap),
      ...FormulaUtils.createSuggestionDatabaseData(this.databaseSchemas),
      ...FormulaUtils.createSuggestKeywords(this.allFunctions)
    ];
    return { suggestions: defaultSuggestions };
  }

  private getCompletionTables(databaseSchemaAsMap: Map<string, DatabaseInfo>): languages.CompletionItem[] {
    Log.debug('getCompletionTables::', databaseSchemaAsMap);
    const completionItems: languages.CompletionItem[] = [];
    let tableSchemas: TableSchema[] = [];
    databaseSchemaAsMap.forEach(databaseSchema => {
      tableSchemas = tableSchemas.concat(databaseSchema.tables);
      completionItems.push(...FormulaUtils.createSuggestionTableData(tableSchemas, databaseSchema.name));
    });
    return completionItems;
  }

  /**
   * Group by key: dbName, value: TableSchema[]
   */
  private getTableAsMap(allTables: TableSchema[], databaseNames: Set<string>, tableNames: Set<string>) {
    const tableSchemaAsMap = new Map<string, TableSchema[]>();
    allTables
      .filter(table => {
        if (ListUtils.isEmpty(tableNames)) {
          return databaseNames.has(table.dbName);
        } else {
          return tableNames.has(table.name) && databaseNames.has(table.dbName);
        }
      })
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

  private getCompletionColumns(databaseSchemaAsMap: Map<string, Record<string, TableSchema>>): languages.CompletionItem[] {
    let completionItems: languages.CompletionItem[] = [];
    databaseSchemaAsMap.forEach((database, dbName) => {
      for (const [tableName, tableSchema] of Object.entries(database)) {
        completionItems = completionItems.concat(FormulaUtils.createSuggestionColumnData(tableSchema.columns, dbName, tableSchema.name));
      }
    });
    return completionItems;
  }

  private suggestionTables(keyword: string): languages.ProviderResult<languages.CompletionList> {
    const database: DatabaseInfo | undefined = this.databaseSchemas.find(database => database.name === keyword);
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
}
