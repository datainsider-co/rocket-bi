import { useEffect, useImperativeHandle, useState, type Ref } from 'react';
import { Editor } from '@monaco-editor/react';
import { EDITOR_THEME_RULES, type EditorLanguage } from './codeEditor.utils';
import { monaco } from './monaco';
import { useMonacoLanguage } from './useMonacoLanguage';
import { useLatest, useSyncedValue } from './useSyncedValue';

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
  /** Ctrl/Cmd+S (v1 `onSave`), instead of the browser saving the page. */
  onSave?: () => void;
  readOnly?: boolean;
  handleRef?: Ref<CodeEditorHandle>;
  lineNumbers?: boolean;
  placeholder?: string;
  ariaLabel: string;
  height: number | string;
  className?: string;
}

const THEME = 'di-code-light';
monaco.editor.defineTheme(THEME, { base: 'vs', inherit: true, rules: [...EDITOR_THEME_RULES], colors: {} });

/** A SQL editor (Monaco) with the given language's colours and suggestions. Lazy loaded through `LazyCodeEditor`. */
export function CodeEditor(props: CodeEditorProps) {
  const { value, onChange, languageId, language, onWord, onRun, onSave, handleRef, lineNumbers = false, readOnly = false, placeholder, ariaLabel, height, className } = props;
  useMonacoLanguage(languageId, language);
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
  const onWordRef = useLatest(onWord);
  const onRunRef = useLatest(onRun);
  const onSaveRef = useLatest(onSave);
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
    const save = editor?.addAction({
      id: 'di.save',
      label: 'Save',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => onSaveRef.current?.()
    });
    return () => {
      action?.dispose();
      save?.dispose();
    };
  }, [editor, onRunRef, onSaveRef]);
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
          readOnly,
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
