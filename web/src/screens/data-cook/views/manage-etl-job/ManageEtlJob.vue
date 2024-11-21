<template>
  <LayoutContent>
    <LayoutHeader :route="listEtlJobRoute" title="My ETL" icon="di-icon-etl-home">
      <div class="layout-header-title">
        <span class="mx-3 text-muted font-weight-light">
          <BreadcrumbIcon icon-size="16"></BreadcrumbIcon>
        </span>
        <template v-if="model">
          <span class="font-weight-normal text-muted">{{ model ? model.displayName : '' }}</span>
          <a v-if="model" @click.prevent="rename" href="#" class="ml-3">
            <small class="text-muted font-weight-light"><i class="di-icon-edit"></i></small>
          </a>
        </template>
        <span v-else class="font-weight-normal text-muted">Create ETL</span>
      </div>
      <div class="ml-auto">
        <DiIconTextButton v-if="model" :disabled="loading" @click.prevent="showSelectSourcePopover" id="add-source" title="Add Source">
          <i class="di-icon-add"></i>
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div v-if="loading" class="d-flex flex-grow-1 bg-white">
      <LoadingComponent></LoadingComponent>
    </div>
    <ManageEtlOperator
      v-else-if="model"
      v-model="model"
      @change="handleModelChanged"
      ref="manageEtlOperator"
      class="manage-etl-operator d-flex flex-grow-1 flex-column"
    ></ManageEtlOperator>
    <div v-else class="d-flex flex-grow-1 bg-white justify-content-center align-items-center">
      <ErrorWidget @onRetry="initData" :error="errorMsg"></ErrorWidget>
    </div>
    <DiRenameModal ref="renameModal" title="Rename ETL"></DiRenameModal>
  </LayoutContent>
</template>
<script lang="ts" src="./ManageEtlJob.ts"></script>
<style lang="scss">
.manage-etl-operator {
  height: calc(100% - 53px);
}
</style>
