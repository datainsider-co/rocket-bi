import { useEffect } from 'react';
import { COMPLETION_KINDS, monarchOf, replacedPrefixLength, type CompletionSpec, type EditorLanguage } from './codeEditor.utils';
import { monaco } from './monaco';

const DEFAULT_TRIGGERS = ['[', '(', ','];

function toSuggestions(specs: readonly CompletionSpec[], model: monaco.editor.ITextModel, position: monaco.Position): monaco.languages.CompletionItem[] {
  const word = model.getWordUntilPosition(position);
  const before = word.startColumn > 1 ? model.getValueInRange(new monaco.Range(position.lineNumber, word.startColumn - 1, position.lineNumber, word.startColumn)) : '';
  return specs.map(spec => {
    const startColumn = word.startColumn - replacedPrefixLength(spec.insertText, before);
    return {
      label: spec.label,
      kind: monaco.languages.CompletionItemKind[COMPLETION_KINDS[spec.kind]],
      insertText: spec.insertText,
      filterText: spec.insertText,
      detail: spec.detail,
      documentation: spec.documentation,
      // Functions last, after the names of the schema.
      sortText: `${spec.kind === 'function' ? 1 : 0}_${spec.label}`,
      range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, word.endColumn)
    };
  });
}

/** Registers the language's colours and suggestions while `language` holds. */
export function useMonacoLanguage(languageId: string, language: EditorLanguage) {
  useEffect(() => {
    if (!monaco.languages.getLanguages().some(item => item.id === languageId)) monaco.languages.register({ id: languageId });
    const disposables = [
      monaco.languages.setLanguageConfiguration(languageId, {
        comments: { lineComment: '--', blockComment: ['/*', '*/'] },
        brackets: [['(', ')']],
        autoClosingPairs: [
          { open: '(', close: ')' },
          { open: "'", close: "'" },
          { open: '"', close: '"' }
        ]
      }),
      monaco.languages.setMonarchTokensProvider(languageId, monarchOf(language.highlight) as unknown as monaco.languages.IMonarchLanguage),
      monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: [...(language.triggerCharacters ?? DEFAULT_TRIGGERS)],
        provideCompletionItems: async (model, position) => {
          const textBefore = model.getValueInRange(new monaco.Range(position.lineNumber, 1, position.lineNumber, position.column));
          const specs = language.completionsAt ? await language.completionsAt(textBefore) : language.completions;
          return { suggestions: toSuggestions(specs, model, position) };
        }
      })
    ];
    return () => disposables.forEach(disposable => disposable.dispose());
  }, [languageId, language]);
}
