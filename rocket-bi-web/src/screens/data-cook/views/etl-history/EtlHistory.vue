<template>
  <LayoutContent>
    <LayoutHeader title="ETL History" icon="di-icon-restore">
      <div class="d-flex ml-auto">
        <SearchInput class="search-input d-none" hint-text="Search ETL name" @onTextChanged="handleKeywordChange" :timeBound="300" />
        <DiIconTextButton id="refresh-database" class="ml-1 my-auto" title="Refresh" @click="search(pagination)">
          <i class="di-icon-reset" />
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div class="layout-content-panel">
      <div v-if="loading && !data.total" class="d-flex flex-grow-1">
        <LoadingComponent v-if="loading"></LoadingComponent>
      </div>
      <div v-else-if="!data.total" class="d-flex flex-grow-1">
        <LayoutNoData icon="di-icon-restore">
          You don't have any ETL History yet
        </LayoutNoData>
      </div>
      <div v-else class="d-flex flex-grow-1" ref="tableContainer">
        <DiTable2
          class="flex-grow-1 flex-shrink-1"
          ref="etlHistoryTable"
          :error-msg="errorMsg"
          :headers="headers"
          :records="data.items"
          :isShowPagination="true"
          :total="data.total"
          :status="tableStatus"
          padding-pagination="40"
          @onPageChange="onPageChange"
          @onSortChanged="handleSortChange"
          @onRetry="retry"
        ></DiTable2>
      </div>
    </div>
  </LayoutContent>
</template>
<script lang="ts" src="./EtlHistory.ts"></script>
<style lang="scss" scoped>
.text-no-underline {
  text-decoration: none;
}
</style>
