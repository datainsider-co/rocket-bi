/*
 * @author: tvc12 - Thien Vi
 * @created: 10/22/21, 1:42 PM
 */

import { CancellationToken, editor, languages, Position, Token } from 'monaco-editor';
import { Log } from '@core/utils';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain';
import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import CompletionItemProvider = languages.CompletionItemProvider;
import { KeywordType, TokenInfo } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProvider';

export class EtlCompletionItemProvider implements CompletionItemProvider {
  public triggerCharacters?: string[];
  private allColumnsNames: Set<string>;
  private allTableNames: Set<string>;
  private allDatabaseSchemas: Set<string>;
  private readonly databaseSchema: DatabaseInfo;
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
    this.databaseSchema = props.databaseSchemas[0];
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

    if (this.isTriggers(context, ['.']) || this.canSuggestionExact(model.getValue(), position)) {
      Log.debug('provideCompletionItems::custom');
      const keyword = FormulaUtils.findNearestKeyword(model.getValue(), position, '\\b\\w+(?=\\.)\\b');
      Log.debug('provideCompletionItems::', keyword);
      if (keyword) {
        return this.createSuggestionByKeyword(keyword, tokenInfo);
      } else {
        return this.createDefaultSuggestion(tokenInfo);
      }
    } else {
      Log.debug('provideCompletionItems::default');
      return this.createDefaultSuggestion(tokenInfo);
    }
  }

  private createSuggestionByKeyword(keyword: string, tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    const keywordType: KeywordType = this.getKeyWordType(keyword);
    Log.debug('createSuggestionByKeyword::', keywordType);
    switch (keywordType) {
      case KeywordType.Column:
        // ignore suggest,end of syntax
        return { suggestions: [] };
      case KeywordType.Table:
        // suggest next column
        return this.createSuggestionColumn(keyword);
      case KeywordType.Database:
        // suggest next table
        return this.createSuggestionTables(keyword);
      default:
        return this.createDefaultSuggestion(tokenInfo);
    }
  }

  private createDefaultSuggestion(tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    // remove reference for show suggestion immediately
    Log.debug('createDefaultSuggestion::', tokenInfo);
    const defaultSuggestions: languages.CompletionItem[] = [
      ...this.getCompletionColumns(tokenInfo.tables),
      ...this.getCompletionAllTables(),
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

  private createSuggestionColumn(keyword: string): languages.ProviderResult<languages.CompletionList> {
    const table: TableSchema | undefined = this.allTables.find(table => table.name == keyword);
    if (table) {
      const dbDisplayName = FormulaUtils.getDbDisplayName(this.databaseSchema);
      const suggestions = FormulaUtils.createSuggestionColumnData(table.columns, dbDisplayName, table.displayName);
      return { suggestions: suggestions };
    } else {
      return {
        suggestions: []
      };
    }
  }

  private createSuggestionTables(keyword: string): languages.ProviderResult<languages.CompletionList> {
    if (this.databaseSchema) {
      const dbDisplayName = FormulaUtils.getDbDisplayName(this.databaseSchema);
      const suggestions = FormulaUtils.createSuggestionTableData(this.databaseSchema.tables, dbDisplayName);
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

  private getCompletionAllTables(): languages.CompletionItem[] {
    const databaseName = FormulaUtils.getDbDisplayName(this.databaseSchema);
    return FormulaUtils.createSuggestionTableData(this.databaseSchema.tables, databaseName);
  }

  /**
   * Group by key: dbName, value: TableSchema[]
   */
  private getTableAsMap(allTables: TableSchema[], tableNames: Set<string>) {
    const tableSchemaAsMap = new Map<string, TableSchema[]>();
    allTables
      .filter(table => tableNames.has(table.name))
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

  private getCompletionColumns(tableNames: Set<string>): languages.CompletionItem[] {
    const tableSchemaAsMap: Map<string, TableSchema[]> = this.getTableAsMap(this.allTables, tableNames);
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
