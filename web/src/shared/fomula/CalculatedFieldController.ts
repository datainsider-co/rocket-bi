/*
 * @author: tvc12 - Thien Vi
 * @created: 5/5/21, 2:57 PM
 */

import { FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import { Column } from '@core/common/domain/model';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { languages } from 'monaco-editor';
import IMonarchLanguage = languages.IMonarchLanguage;

export class CalculatedFieldController implements MonacoFormulaController {
  private languageRegister: any | null = null;
  private tokensProvider: any | null = null;

  private readonly allFunctions: FunctionInfo[];
  private readonly columns: Column[];
  private readonly monarchLanguage: IMonarchLanguage;

  constructor(allFunctions: FunctionInfo[], columns: Column[], monarchLanguage: IMonarchLanguage) {
    this.allFunctions = allFunctions;
    this.columns = columns;
    this.monarchLanguage = monarchLanguage;
  }

  formulaName(): string {
    return 'calculated-field';
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
        const suggestionFunctions = FormulaUtils.createSuggestKeywords(this.allFunctions);
        const suggestionFields = FormulaUtils.createSuggestCalculatedFields(this.getFieldNames());
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
      keywords: this.allFunctions.map(_ => _.name),
      fields: this.getFieldNames(),
      columns: this.getFieldNames(),
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

  private getFieldNames(): string[] {
    return this.columns.map(col => col.displayName);
  }
}
