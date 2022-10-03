<template>
  <LayoutContent>
    <LayoutHeader :title="title" :icon="iconClass">
      <div class="d-flex ml-auto">
        <SearchInput class="search-input d-none-sm" hint-text="Search ETL name" @onTextChanged="handleKeywordChange" :timeBound="300" />
        <DiIconTextButton id="refresh-database" class="ml-1 my-auto" title="Refresh" @click="initData" :event="trackEvents.ETLRefresh">
          <i class="di-icon-reset" />
        </DiIconTextButton>
      </div>
    </LayoutHeader>
    <div ref="bodyContainer" id="list-etl-body-container" class="layout-content-panel">
      <div v-if="loading && !data.total" class="d-flex flex-grow-1">
        <LoadingComponent></LoadingComponent>
      </div>
      <div v-else-if="!errorMsg && !data.total" class="d-flex flex-grow-1">
        <LayoutNoData :icon="iconClass">
          <template v-if="isMyEtlView">
            <div v-if="keyword">
              Not found any ETL with the name <strong>{{ keyword }}</strong>
            </div>
            <div v-else>
              Add your first
              <router-link :to="createEtlJobRoute" class="font-weight-bold">ETL</router-link>
            </div>
          </template>
          <template v-else>
            <div v-if="keyword">
              Not found any ETL with the name <strong>{{ keyword }}</strong>
            </div>
            <div v-else>
              You don't have any ETL yet
            </div>
          </template>
        </LayoutNoData>
      </div>
      <div v-else class="d-flex flex-grow-1" ref="tableContainer">
        <DiTable2
          :error-msg="errorMsg"
          :headers="headers"
          :records="data.items"
          :isShowPagination="false"
          :total="data.total"
          :status="tableStatus"
          class="flex-grow-1 flex-shrink-1"
          @onPageChange="onPageChange"
          @onClickRow="onClickRow"
          @onRetry="initData"
          @beforeScrollEnd="handleTableScrollEnd"
          @onSortChanged="handleSortChanged"
        ></DiTable2>
      </div>
    </div>
    <ForceRunSettingModal ref="forceRunSettingModal" @forceRun="handleForceRunByDate" />
    <ContextMenu
      id="query-action-menu"
      ref="diContextMenu"
      :ignoreOutsideClass="listIgnoreClassForContextMenu"
      minWidth="168px"
      textColor="var(--text-color)"
    />
  </LayoutContent>
</template>
<script lang="ts" src="./ListEtlJob.ts"></script>
<style scoped>
.cdp-body-content-block {
  position: relative;
}
.text-no-underline {
  text-decoration: none;
}
</style>
