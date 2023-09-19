import monaco, { editor, Selection } from 'monaco-editor';
import IIdentifiedSingleEditOperation = editor.IIdentifiedSingleEditOperation;
import { Log } from '@core/utils';
import { ListUtils } from '@/utils';

export class EditorController {
  private editor!: monaco.editor.ICodeEditor;

  setEditor(editor: monaco.editor.ICodeEditor) {
    this.editor = editor;
  }

  /**
   * append text in current cursor focus. it is single cursor
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

  /**
   * append text in all selections. it is multi cursor. and focus in last cursor
   */
  multiAppendText(text: string, isAutoFocus = true) {
    const selections = this.editor.getSelections() ?? [];
    this.editor.executeEdits(
      'insert-text',
      selections.map(selection => ({ range: selection, text: text, forceMoveMarkers: true }))
    );
    if (isAutoFocus) {
      this.editor.focus();
    }
  }

  getSelectedText(): string {
    const paragraph = this.editor.getValue();
    const selections = this.editor.getSelections();
    if (ListUtils.isNotEmpty(selections)) {
      let resultText = '';
      Log.debug('getSelectedText::', paragraph.split('\n'));
      selections!.forEach(selection => {
        const startLine = selection.startLineNumber - 1;
        const endLine = selection.endLineNumber;
        const selectedLines = paragraph
          .split('\n')
          .map(line => line.concat('\n'))
          .slice(startLine, endLine);
        selectedLines[0] = selectedLines[0].slice(selections![0].startColumn - 1);
        selectedLines[selectedLines.length - 1] = selectedLines[selectedLines.length - 1].slice(0, selections![0].endColumn - 1);
        resultText = resultText.concat(...selectedLines);
      });
      return resultText.trim();
    } else {
      return paragraph;
    }
  }

  isSelectingAll(): boolean {
    const paragraph = this.editor.getValue();
    const selections = this.editor.getSelections();
    if (ListUtils.isNotEmpty(selections)) {
      return (
        !EditorController.isSelecting(selections![0]) ||
        (EditorController.isSelectingAtFirst(selections![0]) && EditorController.isSelectingAtEnd(selections![0], paragraph))
      );
    }
    return false;
  }

  private static isSelecting(selection: Selection): boolean {
    return selection.startLineNumber !== selection.endLineNumber || selection.startColumn !== selection.endColumn;
  }

  private static isSelectingAtFirst(selection: Selection): boolean {
    return selection.selectionStartColumn === 1 && selection.selectionStartLineNumber === 1 && selection.startColumn === 1 && selection.startLineNumber === 1;
  }

  private static isSelectingAtEnd(selection: Selection, paragraph: string): boolean {
    const paragraphAsList: string[] = paragraph.split('\n');
    if (paragraphAsList.length >= 1) {
      const isAtEndRow = selection.endLineNumber === selection.positionLineNumber && selection.positionLineNumber === paragraphAsList.length;
      const sizeOfLastParagraph = paragraphAsList![paragraphAsList.length - 1]!.length;
      const isAtEndCharacter = selection.positionColumn === selection.endColumn && selection.endColumn - 1 === sizeOfLastParagraph;
      return isAtEndRow && isAtEndCharacter;
    } else {
      return false;
    }
  }
}
