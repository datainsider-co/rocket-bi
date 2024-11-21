/*
 * @author: tvc12 - Thien Vi
 * @created: 5/5/21, 2:57 PM
 */

import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { TableSchema } from '@core/common/domain/model';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { IDisposable, languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class MeasureController implements MonacoFormulaController {
  private languageRegister: IDisposable | null = null;
  private tokensProvider: IDisposable | null = null;

  private readonly functionInfos: FunctionInfo[];
  private readonly tableSchema: TableSchema;
  private readonly monarchLanguage: IMonarchLanguage;

  constructor(allFunctions: FunctionInfo[], tableSchema: TableSchema, monarchLanguage: IMonarchLanguage) {
    this.functionInfos = allFunctions;
    this.tableSchema = tableSchema;
    this.monarchLanguage = monarchLanguage;
  }

  formulaName(): string {
    return 'measure-field';
  }

  getTheme(): string {
    return `formula-theme-light`;
  }

  init(monaco: any): void {
    monaco.languages.register({ id: this.formulaName() });

    this.tokensProvider = this.initTokenProvider(monaco);

    this.languageRegister = monaco.languages.registerCompletionItemProvider(this.formulaName(), {
      triggerCharacters: [',', '('],
      provideCompletionItems: () => {
        const suggestionFunctions = FormulaUtils.createSuggestKeywords(this.functionInfos);
        const suggestionFields = FormulaUtils.createSuggestionColumnData(this.tableSchema.columns, this.tableSchema.dbName, this.tableSchema.name);
        return { suggestions: suggestionFunctions.concat(suggestionFields) };
      }
    });
  }

  dispose(): void {
    this.languageRegister?.dispose();
    this.tokensProvider?.dispose();
  }

  // see more option in https://microsoft.github.io/monaco-editor/monarch.html
  private initTokenProvider(monaco: any): any {
    // register color
    return monaco.languages.setMonarchTokensProvider(this.formulaName(), {
      ...this.monarchLanguage,
      keywords: this.functionInfos.map(_ => _.name),
      fields: this.tableSchema.columns.map(col => col.displayName),
      columns: this.tableSchema.columns.map(col => col.displayName),
      tokenizer: {
        ...this.monarchLanguage.tokenizer,
        root: [
          ...this.monarchLanguage.tokenizer.root,
          [
            /[0-9a-z_$][\w$]*/,
            {
              cases: {
                '@keywords': 'keyword',
                '@fields': 'field'
              }
            }
          ],
          [/\[.*?]/, 'field']
        ]
      }
    } as any);
  }
}
