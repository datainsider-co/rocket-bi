<template>
  <EtlModal ref="modal" @submit="submit" @hidden="resetModel" :actionName="actionName" :width="1680" class="modal-operator" title="SQL Query">
    <QueryBuilder
      v-if="model"
      ref="queryBuilder"
      :database-schema="etlDatabase"
      :query="model.query"
      :query-language="model.language"
      :showParameter="model.showParameter"
      @selectLanguage="onSelectLanguage"
    ></QueryBuilder>
  </EtlModal>
</template>
<script lang="ts" src="./QueryTable.ts"></script>
<style lang="scss" scoped>
.modal-operator {
  ::v-deep .data-builder {
    min-width: 0;
    padding: 0;

    & > .data-builder-body {
      width: 100%;
      height: calc(90vh - 48px);
      $width: 223px;
      .database-panel {
        background-color: var(--secondary);
        flex: none;
        width: 223px;
      }
      .database-listing .schema-listing {
        margin-top: 10px;
      }
      .query-builder-body {
        width: calc(100% - #{$width});
      }
    }

    .btn-query {
      width: auto;
      height: auto;
      padding: 4px 14px;
    }

    .formula-completion-input {
      background-color: transparent;
      > .padding-top {
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
      }
      & + div:not(.formula-completion-input) {
        background-color: var(--editor-color);
        padding: 12px;
        margin-top: 0;
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }
      .monaco-editor {
        border-radius: 0;
      }
    }

    .query-result .table-container {
      box-shadow: none;
    }
  }
}
</style>
