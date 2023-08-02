/*
 * @author: tvc12 - Thien Vi
 * @created: 5/12/21, 3:23 PM
 */

import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column, DatabaseInfo, TableSchema } from '@core/common/domain/model';
import { isString } from 'lodash';
import { editor, languages, Position, Token } from 'monaco-editor';
import { StringUtils } from '@/utils/StringUtils';
import CompletionItem = languages.CompletionItem;
import { TokenInfo } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProvider';
import { Log } from '@core/utils';
import { IdGenerator } from '@/utils/IdGenerator';

export class FormulaUtils {
  static FieldRank = '1';
  static TableRank = '2';
  static DatabaseRank = '3';
  static MethodRank = '4';
  //https://microsoft.github.io/monaco-editor/api/interfaces/monaco.languages.completionitem.html
  static createSuggestKeywords(functionInfos: FunctionInfo[]): CompletionItem[] {
    return functionInfos.map(functionInfo => {
      return {
        label: functionInfo.name,
        kind: languages.CompletionItemKind.Method,
        insertText: functionInfo.name,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: functionInfo.description,
        detail: functionInfo.title,
        sortText: IdGenerator.generateKey([FormulaUtils.MethodRank, functionInfo.name])
      } as CompletionItem;
    });
  }

  static createSuggestCalculatedFields(fieldNames: string[]): CompletionItem[] {
    return fieldNames.map(displayName => {
      return {
        label: displayName,
        kind: languages.CompletionItemKind.Field,
        insertText: `[${displayName}]`,
        documentation: `Field ${displayName}`,
        detail: 'Field',
        sortText: IdGenerator.generateKey([FormulaUtils.FieldRank, displayName])
      } as CompletionItem;
    });
  }

  static createSuggestionColumnData(columns: Column[], dbDisplayName: string, tableDisplayName: string): CompletionItem[] {
    return columns.map(column => {
      return {
        label: column.name,
        kind: languages.CompletionItemKind.Field,
        insertText: FormulaUtils.escape(column.name),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `Database: ${dbDisplayName}\nTable: ${tableDisplayName}\nColumn: ${column.name}`,
        detail: `${FormulaUtils.escape(dbDisplayName)}.${FormulaUtils.escape(tableDisplayName)}`,
        sortText: IdGenerator.generateKey([FormulaUtils.FieldRank, column.name])
      } as CompletionItem;
    });
  }

  /**
   * escape string to sql syntax
   * ex: escape("student") // `student`
   */
  static escape(text: string) {
    if (isString(text) && FormulaUtils.isEscape(text)) {
      return `\`${text}\``;
    } else {
      return text;
    }
  }

  static isEscape(text: string): boolean {
    return !RegExp(/^[\w\d_]+$/, 'gm').test(text);
  }

  /**
   * convert mọi keyword thành 1 câu query duy nhất, nếu query chứa kí tự đặt biệt sẽ tự escape
   *
   * VD: [sales, 'one record'] => sales.`one record`
   */
  static toQuery(...keywords: string[]): string {
    return keywords.map(keyword => FormulaUtils.escape(keyword)).join('.');
  }

  static removeEscape(text: string) {
    if (StringUtils.isNotEmpty(text)) {
      return text.replaceAll('`', '');
    } else {
      return text;
    }
  }

  static findNearestKeyword(code: string, position: { column: number; lineNumber: number }, regexPattern: string, groupIndex = 0): string | undefined {
    const currentCode = this.getCorrectLineOfCode(code, position);
    const regex = new RegExp(regexPattern, 'gm');
    let lastKeyword: string | undefined = void 0;
    // eslint-disable-next-line  no-constant-condition
    while (true) {
      const groups: string[] | null = regex.exec(currentCode);
      // const match
      if (groups) {
        lastKeyword = groups[groupIndex];
        continue;
      } else {
        return lastKeyword;
      }
    }
  }

  static createSuggestionTableData(tables: TableSchema[], dbName: string): CompletionItem[] {
    return tables.map(table => {
      const tableDisplayName = this.getTableDisplayName(table);
      return {
        label: tableDisplayName,
        kind: languages.CompletionItemKind.Property,
        insertText: FormulaUtils.escape(table.name),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `Database: ${dbName}\nTable: ${tableDisplayName}`,
        detail: `${FormulaUtils.escape(dbName)}`,
        sortText: IdGenerator.generateKey([FormulaUtils.TableRank, tableDisplayName])
      } as CompletionItem;
    });
  }

  // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.languages.completionitem.html#command
  static createSuggestionDatabaseData(databaseInfos: DatabaseInfo[]): CompletionItem[] {
    return databaseInfos.map(database => {
      const dbDisplayName = this.getDbDisplayName(database);
      return {
        label: dbDisplayName,
        kind: languages.CompletionItemKind.Class,
        insertText: FormulaUtils.escape(database.name),
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `Database: ${dbDisplayName}`,
        detail: `${database.name}`,
        sortText: IdGenerator.generateKey([FormulaUtils.DatabaseRank, dbDisplayName])
      } as CompletionItem;
    });
  }

  static getTableDisplayName(table: TableSchema): string {
    return table.displayName || table.name;
  }

  static getDbDisplayName(database: DatabaseInfo): string {
    return database.displayName || database.name;
  }

  static getColumnDisplayName(column: Column): string {
    return column.displayName || column.name;
  }

  /**
   * Default suggest database
   */
  static getDefaultSuggestions(databaseSchemas: DatabaseInfo[]): CompletionItem[] {
    return FormulaUtils.createSuggestionDatabaseData(databaseSchemas);
  }

  static getCorrectLineOfCode(code: string, position: { column: number; lineNumber: number }): string {
    const lines = code.split(/\n/, position.lineNumber);
    const currentLine = lines[position.lineNumber - 1] ?? '';
    let charIndex = position.column;

    for (charIndex; charIndex < currentLine.length; ++charIndex) {
      const isEmpty = !currentLine[charIndex]?.trim();
      if (isEmpty) {
        break;
      }
    }

    return currentLine.slice(0, charIndex);
  }

  static getTokens(text: string, language: string): Token[][] {
    return editor.tokenize(text, language);
  }

  static getTokenInfo(model: editor.ITextModel, language: string): TokenInfo {
    const listTokens = FormulaUtils.getTokens(model.getValue(), language);
    Log.info('getTokenInfo::', listTokens);
    const tokenInfos = new TokenInfo();
    listTokens.forEach((tokens, index) => {
      tokens.forEach(token => FormulaUtils.processToken(model, token, index + 1, tokenInfos, language));
    });
    return tokenInfos;
  }

  static processToken(model: editor.ITextModel, token: Token, lineNumber: number, tokenInfos: TokenInfo, language: string): void {
    switch (token.type) {
      // key define in language tokenizer + this language
      case `databases.${language}`: {
        const database = FormulaUtils.getWordFromToken(model, token, lineNumber);
        tokenInfos.addDatabase(database);
        Log.info('processToken::database', database);
        break;
      }
      case `tables.${language}`: {
        const table = FormulaUtils.getWordFromToken(model, token, lineNumber);
        tokenInfos.addTable(table);
        Log.info('processToken::tables', table);
        break;
      }
      case `columns.${language}`: {
        const column = FormulaUtils.getWordFromToken(model, token, lineNumber);
        tokenInfos.addColumn(column);
        Log.info('processToken::columns', column);
        break;
      }
    }
  }

  private static findDatabaseSchema(dbName: string, databaseSchemas: DatabaseInfo[]): DatabaseInfo | undefined {
    return databaseSchemas.find(database => database.name === dbName);
  }

  private static handleUpdateSuggestionSchemaOnTableAdded(
    databaseName: string | null,
    tableName: string,
    databaseSchemas: DatabaseInfo[],
    databaseAsMap: Map<string, Record<string, TableSchema>>
  ) {
    if (databaseName) {
      if (databaseAsMap.has(databaseName)) {
        const tableSchemaRecord = databaseAsMap.get(databaseName)!;
        const dbSchema = this.findDatabaseSchema(databaseName, databaseSchemas);
        const taleSchema = dbSchema?.tables?.find(table => table.name === tableName.replace(new RegExp('^\\.'), ''));
        if (taleSchema) {
          tableSchemaRecord[tableName] = taleSchema;
          databaseAsMap.set(databaseName, tableSchemaRecord);
        }
      }
    }
  }

  private static handleUpdateSuggestionSchemaOnDatabaseAdded(
    databaseName: string,
    databaseSchemas: DatabaseInfo[],
    databaseMapTableSchema: Map<string, Record<string, TableSchema>>,
    databaseSchemaAsMap: Map<string, DatabaseInfo>
  ) {
    if (!databaseMapTableSchema.has(databaseName)) {
      databaseMapTableSchema.set(databaseName, {});
    }
    if (!databaseSchemaAsMap.has(databaseName)) {
      const databaseSchema = this.findDatabaseSchema(databaseName, databaseSchemas);
      if (databaseSchema) {
        databaseSchemaAsMap.set(databaseName, databaseSchema);
      }
    }
  }

  static getDatabaseAsMapFromToken(
    listTokens: Token[][],
    databaseSchemas: DatabaseInfo[],
    model: editor.ITextModel,
    language: string
  ): { databaseMapTableSchema: Map<string, Record<string, TableSchema>>; databaseSchemaAsMap: Map<string, DatabaseInfo> } {
    const databaseMapTableSchema: Map<string, Record<string, TableSchema>> = new Map<string, Record<string, TableSchema>>();
    const databaseSchemaAsMap: Map<string, DatabaseInfo> = new Map<string, DatabaseInfo>();
    let previousDatabaseName: null | string = null;
    listTokens.forEach((tokens, index) => {
      const lineNumber = index + 1;
      tokens.forEach(token => {
        switch (token.type) {
          // key define in language tokenizer + this language
          case `databases.${language}`: {
            const database = FormulaUtils.getWordFromToken(model, token, lineNumber);
            this.handleUpdateSuggestionSchemaOnDatabaseAdded(database, databaseSchemas, databaseMapTableSchema, databaseSchemaAsMap);
            previousDatabaseName = database;
            Log.info('processToken::database', database);
            break;
          }
          case `tables.${language}`: {
            const tableName = FormulaUtils.getWordFromToken(model, token, lineNumber);
            Log.info('processToken::tables', tableName, previousDatabaseName);
            this.handleUpdateSuggestionSchemaOnTableAdded(previousDatabaseName, tableName, databaseSchemas, databaseMapTableSchema);
            previousDatabaseName = null;
            break;
          }
          case `columns.${language}`: {
            const column = FormulaUtils.getWordFromToken(model, token, lineNumber);
            previousDatabaseName = null;
            Log.info('processToken::columns', column);
            break;
          }
          case `white.${language}`: {
            Log.info('processToken::white', previousDatabaseName);
            previousDatabaseName = null;
            break;
          }
        }
      });
    });
    return { databaseMapTableSchema: databaseMapTableSchema, databaseSchemaAsMap: databaseSchemaAsMap };
  }

  static getWordFromToken(model: editor.ITextModel, token: Token, lineNumber: number, defaultWord = ''): string {
    const position: Position = new Position(lineNumber, token.offset + 1);
    const word = model.getWordAtPosition(position)?.word ?? defaultWord;
    return FormulaUtils.removeEscape(word);
  }

  static isTriggers(context: any, triggers: string[]): boolean {
    const isCharacterTrigger = context.triggerKind == languages.CompletionTriggerKind.TriggerCharacter;
    const isTriggerExisted = triggers.some(trigger => trigger == context.triggerCharacter);
    Log.debug('isTriggers::', isCharacterTrigger, isTriggerExisted);
    return isCharacterTrigger && isTriggerExisted;
  }

  static canSuggestionExact(code: string, position: any): boolean {
    const currentCode = FormulaUtils.getCorrectLineOfCode(code, position);
    Log.debug('canSuggestionExact::', currentCode);
    return !!currentCode.match(RegExp(/\w+\.\s*$/, 'gm'));
  }

  static toETLQuery(query: string, dbName: string, tblName: string) {
    if (StringUtils.isNotEmpty(query)) {
      const regex = new RegExp(`(?:(?:\`?${dbName}\`?.)?\`?\\b${tblName}\\b\`?)`, 'gm');
      const tableQuery = FormulaUtils.toQuery(dbName, tblName);
      return query.replaceAll(regex, tableQuery);
    } else {
      return query;
    }
  }
}
