import { useEffect, useRef } from 'react';
import type { monaco } from './monaco';

/** The latest value of a callback, for listeners Monaco keeps from mount. */
export function useLatest<T>(value: T) {
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
export function useSyncedValue(editor: monaco.editor.IStandaloneCodeEditor | undefined, value: string, onChange: (value: string) => void) {
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
