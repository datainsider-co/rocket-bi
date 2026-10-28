import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import type { EditorLanguage } from '../completions.utils';
import { COMPLETION_KINDS, EDITOR_THEME_RULES, monarchOf, replacedPrefixLength } from './codeEditor.utils';
import { monaco } from './monaco';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Monaco language id; each kind of editor has its own, since a language's suggestions are global. */
  languageId: string;
  language: EditorLanguage;
  /** The word under the cursor, to show the function it names (v1 `onSelectKeyword`). */
  onWord?: (word: string) => void;
  placeholder?: string;
  ariaLabel: string;
  height: number | string;
}

const THEME = 'di-code-light';
monaco.editor.defineTheme(THEME, { base: 'vs', inherit: true, rules: [...EDITOR_THEME_RULES], colors: {} });

/** Registers the language's colours and suggestions while `language` holds. */
function useLanguage(languageId: string, language: EditorLanguage) {
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
        triggerCharacters: ['[', '(', ','],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const before = word.startColumn > 1 ? model.getValueInRange(new monaco.Range(position.lineNumber, word.startColumn - 1, position.lineNumber, word.startColumn)) : '';
          return {
            suggestions: language.completions.map(spec => {
              const startColumn = word.startColumn - replacedPrefixLength(spec.insertText, before);
              return {
                label: spec.label,
                kind: monaco.languages.CompletionItemKind[COMPLETION_KINDS[spec.kind]],
                insertText: spec.insertText,
                filterText: spec.insertText,
                detail: spec.detail,
                documentation: spec.documentation,
                // Functions first, then the columns.
                sortText: `${spec.kind === 'function' ? 1 : 0}_${spec.label}`,
                range: new monaco.Range(position.lineNumber, startColumn, position.lineNumber, word.endColumn)
              };
            })
          };
        }
      })
    ];
    return () => disposables.forEach(disposable => disposable.dispose());
  }, [languageId, language]);
}

/** A SQL editor (Monaco) with the given language's colours and suggestions. Lazy loaded through `LazyCodeEditor`. */
export function CodeEditor({ value, onChange, languageId, language, onWord, placeholder, ariaLabel, height }: CodeEditorProps) {
  useLanguage(languageId, language);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const onWordRef = useRef(onWord);
  useEffect(() => {
    onWordRef.current = onWord;
  }, [onWord]);
  useEffect(() => {
    const listener = editor?.onDidChangeCursorPosition(({ position }) => {
      const word = editor.getModel()?.getWordAtPosition(position)?.word;
      if (word) onWordRef.current?.(word);
    });
    return () => listener?.dispose();
  }, [editor]);

  return (
    <div className="overflow-hidden rounded border border-solid border-black/15" aria-label={ariaLabel}>
      <Editor
        height={height}
        language={languageId}
        theme={THEME}
        value={value}
        onChange={next => onChange(next ?? '')}
        onMount={mounted => setEditor(mounted)}
        options={{
          ariaLabel,
          placeholder,
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          wordBasedSuggestions: 'off',
          fixedOverflowWidgets: true,
          fontSize: 14,
          padding: { top: 12 },
          automaticLayout: true
        }}
      />
    </div>
  );
}
