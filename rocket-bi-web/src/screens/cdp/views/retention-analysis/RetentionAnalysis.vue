<template>
  <div class="d-flex w-100 h-100 retention-analysis">
    <LayoutSidebar :items="navItems">
      <template v-slot:top>
        <!--        <DiShadowButton @click.prevent="saveCurrentFilter" :disabled="!nonEmpty" id="create-cohort" title="Create Cohort">-->
        <!--          <i class="di-icon-add"></i>-->
        <!--        </DiShadowButton>-->
        <DiShadowButton :disabled="true" id="create-retention" title="New" class="cursor-not-allowed">
          <i class="di-icon-add"></i>
        </DiShadowButton>
      </template>
    </LayoutSidebar>
    <LayoutContent>
      <LayoutHeader title="Retention Analysis" icon="di-icon-cohort-analysis"> </LayoutHeader>
      <vuescroll :ops="verticalScrollConfig">
        <div class="cdp-body-content-body-scroller">
          <CdpBlock title="RETENTION" class="event-filters-container mb-2px">
            <div class="cdp-body-content-block-body">
              <div class="events-block">
                <div class="start-event">
                  <div class="event-label">Start Event:</div>
                  <button @click="addStartEvent" id="start-event-button" class="di-button" type="button">
                    <template>
                      <i class="efi-item-icon di-icon-click"></i>
                      <template v-if="startEvent">
                        <span class="event-name"> {{ getDisplayName(startEvent) }} </span>
                      </template>
                      <span v-else class="event-name"> Select event </span>
                    </template>
                  </button>
                </div>
                <div class="return-event">
                  <div class="event-label">Return Event:</div>
                  <button @click="addReturnEvent" id="return-event-button" class="di-button" type="button">
                    <template>
                      <i class="efi-item-icon di-icon-click"></i>
                      <template v-if="returnEvent">
                        <span class="event-name"> {{ getDisplayName(returnEvent) }} </span>
                      </template>
                      <span v-else class="event-name"> Select event </span>
                    </template>
                  </button>
                </div>
              </div>
            </div>
          </CdpBlock>
          <CdpBlock title="FILTER" collapsed class="event-filters-container mb-3">
            <div class="cdp-body-content-block-body">
              <CohortFilterComponent v-model="filterGroups" :hideSaveActions="true"></CohortFilterComponent>
            </div>
          </CdpBlock>
          <div class="cdp-body-content-block retention-result mb-0 pt-1">
            <div class="cdp-body-content-block-title">
              <DiCalendar
                @onCalendarSelected="onChangeDateRange"
                class="date-range-dropdown btn-cdp mt-2 mr-auto"
                id="di-calendar"
                :isShowResetFilterButton="false"
                :mainDateFilterMode="dateMode"
                :modeOptions="DateRangeOptions"
                :getDateRangeByMode="getDateRangeByMode"
                :defaultDateRange="dateRange"
                dateFormatPattern="MMM D, YYYY"
              >
              </DiCalendar>
              <div class="dropdown mt-2 ml-2">
                <DiButton id="interval" :title="timeMetric" class="mr-2 btn-cdp dropdown-toggle" data-toggle="dropdown"></DiButton>
                <div class="dropdown-menu">
                  <a @click.prevent="changeTimeMetric(item)" v-for="item in timeMetrics" :key="item" href="#" class="dropdown-item">
                    {{ item }}
                  </a>
                </div>
              </div>

              <DiButton id="view-type" title="Table" class="btn-cdp mt-2 ml-2">
                <img src="@/assets/icon/charts/ic_table.svg" alt="chart" width="16" />
              </DiButton>
            </div>
            <vuescroll class="cdp-body-content-block-body">
              <div class="cdp-body-content-block-body-scroller">
                <LoadingComponent v-if="loading" class="h-100"></LoadingComponent>
                <table v-else-if="result" class="sankey-table">
                  <thead>
                    <tr>
                      <th class="text-center bg-lighter text-truncate" :colspan="result.headers.length + 2">
                        <div style="font-weight: 500">
                          Users who did <i class="di-icon-click mr-1"></i>
                          <b style="font-weight: 600">{{ getDisplayName(startEvent) }}</b>
                          and then came back and did <i class="di-icon-click mr-1"></i> <b style="font-weight: 600">{{ getDisplayName(returnEvent) }}</b>
                          {{ dateFilterDisplayName }}
                        </div>
                      </th>
                    </tr>
                    <tr>
                      <th class="align-middle bg-lighter" style="min-width: 120px">Date</th>
                      <th class="align-middle text-center bg-lighter">Total</th>
                      <th v-for="(header, headerIdx) in result.headers" :key="'header' + headerIdx" class="text-center">
                        {{ header }}
                      </th>
                    </tr>
                  </thead>
                  <tbody @mouseleave="hideTooltip">
                    <tr v-for="(record, rowIdx) in result.records" :key="'row-index-' + `${rowIdx}`">
                      <th>{{ record.date }}</th>
                      <th>{{ record.total }}</th>
                      <td
                        @mouseover="handleShowTooltip"
                        v-for="(percent, percentIdx) in record.percents"
                        :key="'data-' + `${percentIdx}-${rowIdx}`"
                        class="sankey-td"
                        :style="{ '--percent': `${percent / 100}` }"
                        :class="{ 'd-none': percentIdx + rowIdx >= result.headers.length }"
                      >
                        <template>
                          <div class="sankey-td-default-background"></div>
                          <span :row-idx="rowIdx" :col-idx="percentIdx" class="sankey-td-text"> {{ percent }}% </span>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="cdp-body-content-block-nodata">
                  <i class="cdp-body-content-block-nodata-icon di-icon-web-analysis"></i>
                  <div v-if="error" class="cdp-body-content-block-nodata-msg text-center text-danger">Error: {{ error }}</div>
                  <div v-else-if="isNoData" class="cdp-body-content-block-nodata-msg text-center">
                    No data to display
                  </div>
                  <div v-else class="cdp-body-content-block-nodata-msg text-center">
                    Select an Event to get started
                    <!--                or Cohort-->
                  </div>
                </div>
              </div>
            </vuescroll>
          </div>
        </div>
      </vuescroll>
      <ManageCohort @created="onCreatedCohort" ref="manageCohort"></ManageCohort>
      <SelectStepPopover ref="selectStepPopover"></SelectStepPopover>
      <PopoverV2 placement="bottom" ref="tableTooltip" class="table-tooltip" :hide-on-backdrop="false">
        <template #menu>
          <div class="dropdown-menu dropdown-menu-events p-3" style="letter-spacing: 0.6px; z-index: 4">
            <div class="d-flex align-items-center mar-b-12">
              <i class="di-icon-click mr-2"></i> <b>{{ tooltipData.retainedTime }}</b>
            </div>
            For users who entered on {{ tooltipData.time }}
            <div class="d-flex align-items-center mar-t-12">
              <i class="di-icon-cohort mr-2"></i>
              <b class="mr-1">{{ Math.round((tooltipData.total * tooltipData.percent) / 100) }}</b> retained users
              <b class="ml-1">{{ tooltipData.percent }}%</b>
            </div>
            <div class="d-flex align-items-center mar-t-12">
              <i style="color: #e34f2f;" class="di-icon-drop mr-2"></i>
              <b class="mr-1">{{ Math.round(tooltipData.total - (tooltipData.percent * tooltipData.total) / 100) }}</b>
              dropped users
              <b class="ml-1">{{ 100 - tooltipData.percent }}%</b>
            </div>
          </div>
        </template>
      </PopoverV2>
    </LayoutContent>
  </div>
</template>
<script src="./RetentionAnalysis.ts" lang="ts"></script>

<style lang="scss">
.retention-tooltip {
  padding: 16px;
  width: 305px;
  height: 320px;
  overflow: hidden;
  background-color: var(--secondary);
  color: red;
  border-radius: 4px;
}
</style>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.retention-analysis {
  overflow: hidden;

  .cdp-body-content-block {
    margin-bottom: 2px;
  }

  .event-filters-item {
    margin-top: 0 !important;
  }

  .events-block {
    .start-event,
    .return-event {
      display: flex;
      align-items: center;

      #return-event-button,
      #start-event-button {
        cursor: pointer;
        background-color: #fafafb !important;
        height: 33px;

        i {
          margin-right: 8px;
        }
      }

      .event-label {
        width: 101px;
        @include semi-bold-14();
        letter-spacing: 0.6px;
        color: var(--secondary-text-color);
      }

      .event-name {
        @include semi-bold-14();
        font-weight: 500;
        letter-spacing: 0.6px;
        color: #000000;
        cursor: pointer;
      }
    }

    .return-event {
      margin-top: 8px;
    }
  }

  .sankey-table {
    th,
    td {
      padding: 0 16px;
    }

    .sankey-td {
      position: relative;
      text-align: center;
      font-weight: 500;
      overflow: hidden;
      cursor: pointer;
      //opacity: 0.3;
      //background-color: var(--accent);

      //background-color: #fff;
      //color: var(--secondary);

      &-default-background {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        opacity: 0.3;
        background-color: var(--accent);
        z-index: 1;
      }

      &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        opacity: var(--percent);
        background-color: var(--accent);
        z-index: 2;
      }

      &:hover .sankey-td-default-background,
      &:hover:before {
        outline-offset: -2px;
        outline: 1px solid var(--primary);
        -moz-outline-radius: 10px;
      }

      &-text {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--secondary);
        width: 100%;
        height: 100%;
        cursor: pointer;
        z-index: 3;

        &.invert-color {
          color: var(--accent);
        }
      }
    }
  }

  .cdp-body-content-body-scroller {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    .retention-result {
      flex: 1;
      min-height: 52vh;
      background: var(--secondary);

      .cdp-body-content-block-body {
        flex: 1;

        .cdp-body-content-block-body-scroller {
          display: flex;
          flex-direction: column;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;

          .cdp-body-content-block-nodata {
            flex: 1;
          }
        }
      }
    }
  }
}
</style>
