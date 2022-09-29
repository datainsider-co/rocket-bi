/*
 * @author: tvc12 - Thien Vi
 * @created: 11/17/21, 1:45 PM
 */

import { CancellationToken, editor, languages, Position } from 'monaco-editor';
import { SparkBuiltinFunctions, SparkKeywords, SparkOperators } from '@/shared/fomula/spark/LanguageTokenizer';
import { TableInfo } from '@core/lake-house';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { KeywordType, TokenInfo } from '@/shared/fomula/clickhouse/ClickHouseCompletionItemProvider';
import { Log } from '@core/utils';
import CompletionItemProvider = languages.CompletionItemProvider;
import CompletionItemKind = languages.CompletionItemKind;
import { StringUtils } from '@/utils/StringUtils';

export class SparkCompletionItemProvider implements CompletionItemProvider {
  public triggerCharacters?: string[];
  private allTableNames: Set<string>;
  private allColumnNames: Set<string>;

  constructor(protected tables: TableInfo[], protected readonly language: string, triggerCharacters?: string[]) {
    this.allTableNames = new Set<string>(tables.map(table => table.tableName));
    this.allColumnNames = new Set<string>(FormulaUtils.getAllColumns(tables));
    this.triggerCharacters = triggerCharacters;
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
      const keyword = FormulaUtils.findNearestKeyword(model.getValue(), position, '@?\\w+(?=\\.)\\b');
      Log.debug('provideCompletionItems::keyword', keyword);
      if (keyword) {
        return this.createSuggestionByKeyword(keyword, tokenInfo);
      } else {
        return this.createSuggestDefault(tokenInfo);
      }
    } else {
      return this.createSuggestDefault(tokenInfo);
    }
  }

  protected createSuggestDefault(tokenInfo: TokenInfo) {
    return {
      suggestions: [
        ...this.buildSuggestionColumns(tokenInfo.tables),
        ...this.createSuggestions(
          this.tables.map(table => table.tableName),
          CompletionItemKind.Variable
        ),
        ...this.createSuggestions(SparkKeywords, CompletionItemKind.Keyword),
        ...this.createSuggestions(SparkOperators, CompletionItemKind.Operator),
        ...this.createSuggestions(SparkBuiltinFunctions, CompletionItemKind.Function)
      ]
    };
  }

  private createSuggestionByKeyword(keyword: string, tokenInfo: TokenInfo): languages.ProviderResult<languages.CompletionList> {
    const keywordType: KeywordType = this.getKeyWordType(keyword);
    Log.debug('createSuggestionByKeyword::', keywordType);
    switch (keywordType) {
      case KeywordType.Table:
        // suggest next column
        return this.createSuggestionColumns(keyword);
      default:
        return this.createSuggestDefault(tokenInfo);
    }
  }

  private createSuggestionColumns(keyword: string): languages.ProviderResult<languages.CompletionList> {
    const suggestions = this.buildSuggestionColumns(
      new Set<string>([keyword])
    );
    return {
      suggestions: suggestions
    };
  }

  private buildSuggestionColumns(currentTableNames: Set<string>): languages.CompletionItem[] {
    const tables = this.tables.filter(table => currentTableNames.has(table.tableName));

    return tables.flatMap(table => {
      return this.createSuggestions(
        table.schema.map(field => FormulaUtils.escape(field.name)),
        CompletionItemKind.Property
      );
    });
  }

  private getKeyWordType(keyword: string): KeywordType {
    if (this.allTableNames.has(keyword)) {
      return KeywordType.Table;
    }
    if (this.allColumnNames.has(keyword)) {
      return KeywordType.Column;
    }
    return KeywordType.Keyword;
  }

  private createSuggestions(functions: string[], completionItemKind: languages.CompletionItemKind): languages.CompletionItem[] {
    return functions.map(fn => {
      return {
        label: fn,
        kind: completionItemKind,
        insertText: fn,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet
      } as languages.CompletionItem;
    });
  }
}
