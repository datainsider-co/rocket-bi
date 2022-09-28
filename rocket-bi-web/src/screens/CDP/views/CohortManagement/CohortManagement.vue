<template>
  <div class="d-flex w-100 h-100">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <DiShadowButton @click.prevent="createCohort" id="create-cohort" title="Create Cohort" :event="trackEvents.CreateCohort">
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Cohorts Management" icon="di-icon-user">
        <div class="ml-auto d-flex">
          <DiIconTextButton @click.prevent="deleteSelected" v-if="selectedItems.length > 0" id="delete" title="Delete">
            <i class="di-icon-delete"></i>
          </DiIconTextButton>
          <!--          <DiIconTextButton @click.prevent="exportAsCSV" id="share" title="Export as CSV">-->
          <!--            <i class="di-icon-export"></i>-->
          <!--          </DiIconTextButton>-->
          <DiIconTextButton id="refresh" class="ml-1 my-auto" title="Refresh" @click="retry" :event="trackEvents.CohortManagementRefresh">
            <i class="di-icon-reset" />
          </DiIconTextButton>
        </div>
      </LayoutHeader>
      <div v-if="isShowEmptyWidget" class="layout-content-panel mb-0 p-0 flex-grow-1">
        <div class="cdp-body-content-block-body">
          <div class="cdp-body-content-block-nodata">
            <i class="cdp-body-content-block-nodata-icon di-icon-web-analysis"></i>
            <div class="cdp-body-content-block-nodata-msg text-center">
              Your cohort listing is empty
              <br />
              <a @click.prevent="createCohort" href="#" class="font-weight-bold" :event="trackEvents.CreateCohort">Click here</a>
              to create new cohort
            </div>
          </div>
        </div>
      </div>
      <div v-else class="layout-content-panel">
        <DiTable2
          ref="table"
          :error-msg="errorMsg"
          :headers="headers"
          :records="result.data"
          :isShowPagination="true"
          :total="result.total"
          :status="tableStatus"
          :paddingPagination="50"
          @onPageChange="onPageChange"
          @onClickRow="onClickRow"
          @onRetry="retry"
          class="flex-grow-1"
        ></DiTable2>
      </div>
      <ManageCohort @created="reset" @updated="reset" ref="manageCohort"></ManageCohort>
      <ContextMenu ref="diContextMenu" :ignoreOutsideClass="listIgnoreClassForContextMenu" minWidth="150px" textColor="var(--text-color)" />
    </LayoutContent>
  </div>
</template>
<script lang="ts" src="./CohortManagement.ctrl.ts"></script>
<style lang="scss">
.cohort-management {
  .cdp-body-content-body {
    display: flex;
    background: var(--secondary);
    border-radius: 4px;
    .cdp-body-content-block-table {
      flex: 1;
      display: flex;
      .cohort-table-management {
        flex: 1;
      }
    }
  }
}
</style>
