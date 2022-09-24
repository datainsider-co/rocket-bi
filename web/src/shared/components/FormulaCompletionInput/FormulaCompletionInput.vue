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
import { Component, Emit, Prop, PropSync, Ref, Vue, Model } from 'vue-property-decorator';
import MonacoEditor, { monaco } from 'monaco-editor-vue';
import {
  EtlQueryThemeLight,
  FormulaThemeDark,
  FormulaThemeLight,
  QueryThemeDark,
  QueryThemeLight,
  SparkQueryThemeLight
} from '@/shared/constants/CustomEditorTheme';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { DebounceAction } from '@/shared/anotation/DebounceAction';
import { FormulaUtils } from '@/shared/fomula/FormulaUtils';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import { Log } from '@core/utils';
import { EditorController } from '@/shared/fomula/EditorController';
import { DomUtils, ListUtils } from '@/utils';
import { StringUtils } from '@/utils/string.utils';

monaco.editor.defineTheme('formula-theme-dark', FormulaThemeDark);
monaco.editor.defineTheme('formula-theme-light', FormulaThemeLight);
monaco.editor.defineTheme('query-theme-dark', QueryThemeDark);
monaco.editor.defineTheme('query-theme-light', QueryThemeLight);
monaco.editor.defineTheme('spark-theme-light', SparkQueryThemeLight);

monaco.editor.defineTheme('etl-query-theme-light', EtlQueryThemeLight);
monaco.editor.defineTheme('etl-query-theme-dark', EtlQueryThemeLight);

@Component({
  components: { MonacoEditor }
})
export default class FormulaCompletionInput extends Vue {
  @Model('input', { required: true, type: String, default: '' })
  private readonly value!: string;

  @Prop({ required: true, type: Object })
  private readonly formulaController!: FormulaController;

  @Prop({ required: false, type: Object, default: () => new EditorController() })
  private readonly editorController!: EditorController;

  @Prop({ type: Boolean, default: false })
  private readonly fixedOverflowWidgets!: boolean;

  @Prop({ required: false, type: String, default: 'Enter your query here...' })
  private readonly placeholder!: string;

  @Ref()
  private monacoEditor?: any;

  private get isShowPlaceholder(): boolean {
    return StringUtils.isEmpty(this.value);
  }

  private cursorChangeListener?: any;

  private blurEditorWidgetListener?: any;

  private readonly editorOptions: any = {
    minimap: {
      enabled: false
    },
    lineNumbers: 'off',
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

  private get themeName() {
    return _ThemeStore.currentThemeName;
  }

  private get formulaTheme(): string {
    return this.formulaController.getTheme(this.themeName);
  }

  private get formulaName(): string {
    return this.formulaController.formulaName();
  }

  mounted() {
    this.formulaController.init(monaco);
    this.catchKeyAction();
    if (this.monacoEditor.editor) {
      this.cursorChangeListener = this.monacoEditor.editor.onDidChangeCursorPosition(this.handleOnCursorChanged);
      this.blurEditorWidgetListener = this.monacoEditor.editor.onDidBlurEditorWidget(this.handleOnBlurEditorWidget);
      this.editorController.setEditor(this.monacoEditor.editor);
    }
  }

  beforeDestroy() {
    this.formulaController.dispose();
    this.cursorChangeListener?.dispose();
    this.blurEditorWidgetListener?.dispose();
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
  private handleOnCursorChanged(payload: { position: any }) {
    const keyword: string | undefined = FormulaUtils.findNearestKeyword(this.value, payload.position, '\\b\\w+(?=\\()');
    if (keyword) {
      this.emitChangeKeyword(keyword);
    }
  }

  private onCodeChange(newCode: string): void {
    this.$emit('input', newCode);
  }

  @Emit('onSelectKeyword')
  private emitChangeKeyword(keyword: string): string {
    return keyword;
  }

  focus() {
    this.$nextTick(() => {
      // layout ： https://github.com/PolymerVis/monaco-editor/issues/1#issuecomment-357378349
      this.monacoEditor.editor.layout();
      this.monacoEditor.editor.focus();
    });
  }

  private handleOnBlurEditorWidget(e: any) {
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
    padding-left: 20px;
    pointer-events: none;
    font-size: 14px;
  }
}
</style>
