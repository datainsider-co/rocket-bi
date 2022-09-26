import monaco, { editor } from 'monaco-editor';
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;

export class EditorController {
  private editor!: monaco.editor.ICodeEditor;

  setEditor(editor: monaco.editor.ICodeEditor) {
    this.editor = editor;
  }

  /**
   * append text in current cursor focus
   */
  appendText(text: string, isAutoFocus = true) {
    const insertOptions: IIdentifiedSingleEditOperation = {
      range: this.editor?.getSelection(),
      text: text,
      forceMoveMarkers: true
    } as IIdentifiedSingleEditOperation;
    this.editor.executeEdits('insert-text', [insertOptions]);
    if (isAutoFocus) {
      this.editor.focus();
    }
  }
}
