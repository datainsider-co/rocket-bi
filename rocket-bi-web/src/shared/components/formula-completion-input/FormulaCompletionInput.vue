<template>
  <div class="formula-completion-input">
    <MonacoEditor
      ref="monacoEditor"
      :language="formulaName"
      :options="editorOptions"
      :theme="formulaTheme"
      :value="value"
      class="code"
      @change="onCodeChange"
    ></MonacoEditor>
    <div v-if="isShowPlaceholder" class="formula-completion-input--placeholder">{{ placeholder }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import MonacoEditor, { monaco } from 'monaco-editor-vue';
import { EtlQueryThemeLight, FormulaThemeLight, QueryThemeLight, SparkQueryThemeLight } from '@/shared/constants/CustomEditorTheme';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { DebounceAction } from '@/shared/anotation/DebounceAction';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { Log } from '@core/utils';
import { EditorController } from '@/shared/fomula/EditorController';
import { StringUtils } from '@/utils/StringUtils';
import { editor } from 'monaco-editor';
import IModelContentChangedEvent = editor.IModelContentChangedEvent;

monaco.editor.defineTheme('formula-theme-light', FormulaThemeLight);
monaco.editor.defineTheme('query-theme-light', QueryThemeLight);
monaco.editor.defineTheme('spark-theme-light', SparkQueryThemeLight);

monaco.editor.defineTheme('etl-query-theme-light', EtlQueryThemeLight);

@Component({
  components: { MonacoEditor }
})
/**
 * don't use v-model.trim cause cursor position will be wrong
 */
export default class FormulaCompletionInput extends Vue {
  @Model('input', { required: true, type: String, default: '' })
  protected readonly value!: string;

  @Prop({ required: true, type: Object })
  protected readonly formulaController!: MonacoFormulaController;

  @Prop({ required: false, type: Object, default: () => new EditorController() })
  protected readonly editorController!: EditorController;

  @Prop({ type: Boolean, default: false })
  protected readonly fixedOverflowWidgets!: boolean;

  @Prop({ required: false, type: String, default: 'Enter your query here...' })
  protected readonly placeholder!: string;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isReadOnly!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isFixedScroll!: boolean;
  @Ref()
  protected monacoEditor?: any;

  protected get isShowPlaceholder(): boolean {
    return StringUtils.isEmpty(this.value);
  }

  protected cursorChangeListener?: any;

  protected blurEditorWidgetListener?: any;

  protected readonly editorOptions: any = {
    minimap: {
      enabled: false
    },
    lineNumbers: 'on',
    scrollbar: {
      horizontal: 'hidden',
      vertical: 'hidden'
    },
    hideCursorInOverviewRuler: true,
    overviewRulerBorder: false,
    overviewRulerLanes: 0,
    automaticLayout: true,
    glyphMargin: false,
    // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
    lineDecorationsWidth: 4,
    lineNumbersMinChars: 4,
    padding: {
      top: 16
    },
    fixedOverflowWidgets: this.fixedOverflowWidgets
  };

  protected get formulaTheme(): string {
    return this.formulaController.getTheme();
  }

  protected get formulaName(): string {
    return this.formulaController.formulaName();
  }

  mounted() {
    this.formulaController.init(monaco);
    this.catchKeyAction();
    this.setReadOnly(this.isReadOnly);
    this.setSuggestSelection('first');
    this.setFixedScroll(this.isFixedScroll);
    if (this.monacoEditor.editor) {
      this.cursorChangeListener = this.monacoEditor.editor.onDidChangeCursorPosition(this.handleOnCursorChanged);
      this.blurEditorWidgetListener = this.monacoEditor.editor.onDidBlurEditorWidget(this.handleOnBlurEditorWidget);
      this.monacoEditor.editor.onDidChangeModelContent((event: IModelContentChangedEvent) => {
        Log.debug('onDidChangeContent::', event);
        if (event.changes[0].text === '\n') {
          const id = { major: 1, minor: 1 };
          const range = event.changes[0].range;
          const op = { identifier: id, range: range, text: '    ', forceMoveMarkers: false };
          this.monacoEditor.editor.executeEdits('add-space-before-enter', [op]);
        }
      });
      this.editorController.setEditor(this.monacoEditor.editor);
    }
  }

  beforeDestroy() {
    this.formulaController.dispose();
    this.cursorChangeListener?.dispose();
    this.blurEditorWidgetListener?.dispose();
  }

  protected setReadOnly(readOnly: boolean) {
    this.monacoEditor.editor.updateOptions({ readOnly: readOnly });
  }

  protected setSuggestSelection(suggestSelection: string) {
    this.monacoEditor.editor.updateOptions({ suggestSelection: suggestSelection });
  }

  protected setFixedScroll(enabled: boolean) {
    this.monacoEditor.editor.updateOptions({ scrollbar: { handleMouseWheel: !enabled } });
  }

  catchKeyAction() {
    this.monacoEditor.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, (e: Event) => {
      this.$emit('onExecute');
    });
    this.monacoEditor.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S, (e: Event) => {
      this.$emit('onSave', e);
    });
  }

  @DebounceAction({ timeDebounce: 100 })
  protected handleOnCursorChanged(payload: { position: any }) {
    const keyword: string | undefined = FormulaUtils.findNearestKeyword(this.value, payload.position, '\\b\\w+(?=\\()');
    if (keyword) {
      this.emitChangeKeyword(keyword);
    }
  }

  protected onCodeChange(newCode: string): void {
    this.$emit('input', newCode);
  }

  @Emit('onSelectKeyword')
  protected emitChangeKeyword(keyword: string): string {
    return keyword;
  }

  focus() {
    this.$nextTick(() => {
      // layout ： https://github.com/PolymerVis/monaco-editor/issues/1#issuecomment-357378349
      this.monacoEditor.editor.layout();
      this.monacoEditor.editor.focus();
    });
  }

  protected handleOnBlurEditorWidget(e: any) {
    // if(St this.formulaData)
    this.$emit('blur', e);
  }
}
</script>

<style lang="scss">
.formula-completion-input {
  position: relative;

  .code {
    .monaco-editor {
      background-color: var(--input-background-color);

      border-radius: 4px;

      .margin,
      .monaco-editor-background {
        background: transparent;
      }

      //.lines-content.monaco-editor-background {
      //margin-top: 15px;
      //}
    }
  }

  .formula-completion-input--placeholder {
    position: absolute;
    top: 0;
    opacity: 0.5;
    color: var(--secondary-text-color);
    padding-left: 50px;
    pointer-events: none;
    font-size: 14px;
  }
}
</style>
