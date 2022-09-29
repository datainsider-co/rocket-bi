<template>
  <div class="lake-query-component">
    <Split :gutterSize="16" direction="vertical">
      <SplitArea :size="50" :minSize="235">
        <div class="lake-query-component--editor h-100">
          <Editor
            :formula-controller="formulaController"
            :editorController="editorController"
            :query.sync="query"
            class="editor--body"
            @onExecute="handleTestQuery"
          ></Editor>
          <div class="editor--footer">
            <DiButton v-if="resultPath" :disabled="isLoading" border title="View File Result" @click="handleViewFileResult"></DiButton>
            <DiButton v-if="isShowResult" :disabled="isLoading" border title="Show Result" @click="handleShowResult(from, size)"></DiButton>
            <DiButton :disabled="isLoading" border title="Test Query" @click="handleTestQuery">
              <template v-slot:suffix-content>
                <span class="d-none d-sm-inline text-nowrap ml-1">(Ctrl + Enter)</span>
              </template>
            </DiButton>
            <template v-if="isExecutingQuery">
              <DiButton border title="Cancel" @click="confirmCancelExecuteQuery"></DiButton>
            </template>
            <template v-else>
              <DiButton :disabled="isLoading" border title="Execute" @click="handleExecuteQuery"></DiButton>
            </template>
            <DiButton :disabled="isLoading || !hasQuery" primary :title="titleAddJob" @click="handleAddJob"></DiButton>
          </div>
        </div>
      </SplitArea>
      <SplitArea :size="50">
        <div class="lake-query-component--body mt-0" ref="result-element">
          <label>RESULT</label>
          <template v-if="isShowDefault">
            <EmptyWidget>Data is empty</EmptyWidget>
          </template>
          <template v-else>
            <DiTable
              id="lake-table"
              :error-msg="msg"
              :headers="headers"
              :records="records"
              :status="status"
              :total="total"
              is-show-pagination
              :get-max-height="calculatedHeight"
              disableSort
              @onPageChange="onPageChanged"
              @onRetry="handleTestQuery"
              :allowShowEmpty="false"
            ></DiTable>
          </template>
        </div>
        <SQLLakeJobConfigModal :is-show.sync="isShowJobModalConfig" :job="sqlCloneJob" @created="handleJobCreated"></SQLLakeJobConfigModal>
      </SplitArea>
    </Split>
  </div>
</template>

<script lang="ts" src="./LakeSQLQueryComponent.ts"></script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.lake-query-component {
  display: flex;
  flex: 1;
  flex-direction: column;
  //height: 100%;
  overflow: hidden;

  &--editor {
    background: var(--secondary);
    border-radius: 4px;
    display: flex;
    flex: 3;

    flex-direction: column;
    padding: 12px 16px 16px;

    > .editor--header {
      margin-bottom: 12px;
      text-align: left;
    }

    > .editor--body {
      margin-bottom: 16px;
      height: calc(100% - 50px);
      overflow: hidden;
    }

    > .editor--footer {
      align-items: center;
      display: flex;
      flex-direction: row;
      justify-content: right;

      > div {
        height: 33px;
        min-width: 78px;
      }

      > div + div {
        margin-left: 12px;
      }
    }
  }

  &--body {
    background: var(--secondary);
    border-radius: 4px;
    flex: 4;
    margin-top: 16px;
    overflow: hidden;

    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 16px;

    label {
      color: var(--secondary-text-color);
      font-size: 14px;
      font-stretch: normal;
      font-style: normal;
      font-weight: bold;
      letter-spacing: 0.6px;
      line-height: normal;
      text-align: justify;
    }

    .empty-text {
      @include regular-text(0.27px, var(--secondary-text-color));
      font-size: 16px;
    }
    //
    .di-table {
      height: 100%;
    }
  }
}
</style>
