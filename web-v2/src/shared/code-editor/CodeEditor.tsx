import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Editor } from '@monaco-editor/react';
import { EDITOR_THEME_RULES, type EditorLanguage } from './codeEditor.utils';
import { monaco } from './monaco';
import { useMonacoLanguage } from './useMonacoLanguage';

/** What a page does to the editor's text beyond its value (v1 `EditorController`). */
export interface CodeEditorHandle {
  /** Puts `text` at each cursor, over what is selected, and focuses the editor. */
  insertText: (text: string) => void;
  /** The selected text of the first selection; `''` when nothing is selected. */
  selectedText: () => string;
}

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Monaco language id; each kind of editor has its own, since a language's suggestions are global. */
  languageId: string;
  language: EditorLanguage;
  /** The word under the cursor, to show the function it names (v1 `onSelectKeyword`). */
  onWord?: (word: string) => void;
  /** Ctrl/Cmd+Enter (v1 `onExecute`). */
  onRun?: () => void;
  handleRef?: Ref<CodeEditorHandle>;
  lineNumbers?: boolean;
  placeholder?: string;
  ariaLabel: string;
  height: number | string;
  className?: string;
}

const THEME = 'di-code-light';
monaco.editor.defineTheme(THEME, { base: 'vs', inherit: true, rules: [...EDITOR_THEME_RULES], colors: {} });

/** The latest value of a callback, for listeners Monaco keeps from mount. */
function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Monaco keeps its own text; `value` goes into it only when the page changed it. A value the editor sent can come back
 * after newer keys were typed (the page renders later than Monaco), and putting it back would drop those keys, as
 * `@monaco-editor/react`'s `value` did. Sent values wait in a queue until they come back; any other value is the
 * page's.
 */
function useSyncedValue(editor: monaco.editor.IStandaloneCodeEditor | undefined, value: string, onChange: (value: string) => void) {
  const sent = useRef<string[]>([]);
  useEffect(() => {
    const index = sent.current.indexOf(value);
    if (index >= 0) {
      sent.current = sent.current.slice(index + 1);
      return;
    }
    sent.current = [];
    const model = editor?.getModel();
    if (!editor || !model || model.getValue() === value) return;
    editor.pushUndoStop();
    editor.executeEdits('set-value', [{ range: model.getFullModelRange(), text: value, forceMoveMarkers: true }]);
    editor.pushUndoStop();
  }, [editor, value]);
  return (next: string | undefined) => {
    sent.current.push(next ?? '');
    onChange(next ?? '');
  };
}

/** A SQL editor (Monaco) with the given language's colours and suggestions. Lazy loaded through `LazyCodeEditor`. */
export function CodeEditor({ value, onChange, languageId, language, onWord, onRun, handleRef, lineNumbers = false, placeholder, ariaLabel, height, className }: CodeEditorProps) {
  useMonacoLanguage(languageId, language);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const onWordRef = useLatest(onWord);
  const onRunRef = useLatest(onRun);
  const emit = useSyncedValue(editor, value, onChange);
  useEffect(() => {
    const listener = editor?.onDidChangeCursorPosition(({ position }) => {
      const word = editor.getModel()?.getWordAtPosition(position)?.word;
      if (word) onWordRef.current?.(word);
    });
    return () => listener?.dispose();
  }, [editor, onWordRef]);
  useEffect(() => {
    const action = editor?.addAction({
      id: 'di.run',
      label: 'Run',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => onRunRef.current?.()
    });
    return () => action?.dispose();
  }, [editor, onRunRef]);
  useImperativeHandle(
    handleRef,
    () => ({
      insertText: text => {
        if (!editor) return;
        const selections = editor.getSelections() ?? [];
        editor.executeEdits('insert-text', selections.map(range => ({ range, text, forceMoveMarkers: true })));
        editor.focus();
      },
      selectedText: () => {
        const selection = editor?.getSelection();
        return selection ? (editor?.getModel()?.getValueInRange(selection) ?? '') : '';
      }
    }),
    [editor]
  );

  return (
    <div className={`overflow-hidden rounded border border-solid border-black/15 ${className ?? ''}`} aria-label={ariaLabel}>
      <Editor
        height={height}
        language={languageId}
        theme={THEME}
        defaultValue={value}
        onChange={emit}
        onMount={mounted => setEditor(mounted)}
        options={{
          ariaLabel,
          placeholder,
          minimap: { enabled: false },
          lineNumbers: lineNumbers ? 'on' : 'off',
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
