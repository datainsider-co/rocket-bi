<template>
  <div class="di-editor">
    <div class="formula-completion-input">
      <div class="padding-top"></div>
      <FormulaCompletionInput
        v-if="formulaController"
        ref="input"
        :value="query"
        :editorController="editorController"
        :formulaController="formulaController"
        class="query-input"
        @blur="checkShowEditorPlaceholder"
        @onExecute="$emit('onExecute')"
        @input="updateQuery"
        fixedOverflowWidgets
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { FormulaController } from '@/shared/fomula/FormulaController';
import { StringUtils } from '@/utils/StringUtils';
import { EditorController } from '@/shared/fomula/EditorController';

@Component({
  components: {
    FormulaCompletionInput
  }
})
export default class Editor extends Vue {
  @Prop({ required: true })
  private readonly formulaController!: FormulaController;

  @Prop({ required: true, type: Object })
  private readonly editorController!: EditorController;

  @Prop({ required: true, type: String })
  private readonly query!: string;

  private isShowPlaceHolder = true;
  @Ref()
  private readonly input!: FormulaCompletionInput;

  checkShowEditorPlaceholder() {
    this.isShowPlaceHolder = StringUtils.isEmpty(this.query);
  }

  mounted() {
    this.checkShowEditorPlaceholder();
  }

  @Watch('query')
  private onDefaultQueryChanged(newValue: string) {
    this.checkShowEditorPlaceholder();
  }

  private onClickPlaceholder() {
    this.isShowPlaceHolder = false;
    this.input?.focus();
  }

  @Emit('update:query')
  private updateQuery(query: string) {
    return query;
  }
}
</script>

<style lang="scss">
.di-editor {
  .placeholder {
    //min-height: 150px !important;
    padding-left: 19px;
    padding-top: 16px;
  }

  .formula-completion-input {
    background-color: var(--input-background-color) !important;
    border-radius: 4px;
    text-align: left;
    height: 100%;

    .padding-top {
      background-color: var(--editor-color);
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      height: 16px;
    }

    .query-input {
      height: calc(100% - 16px) !important;
      min-height: 134px;

      .view-lines {
        border-radius: 0;
        text-align: left;
      }

      .overflow-guard {
        border-radius: 4px;
      }

      .monaco-editor {
        border-radius: 0 0 4px 4px;

        &,
        .margin,
        .monaco-editor-background,
        .inputarea.ime-input {
          background-color: var(--editor-color);
        }
      }
    }
  }
}
</style>
