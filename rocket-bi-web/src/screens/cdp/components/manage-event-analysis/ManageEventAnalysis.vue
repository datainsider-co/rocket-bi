<template>
  <div v-if="model" class="manage-event-analysis">
    <CdpBlock title="SELECT EVENT" class="event-filters-container mb-2px" @update:collapsed="onEventBlockCollapse">
      <div v-for="(step, idx) in model.steps" :key="idx" class="event-filters-item">
        <span class="efi-group">{{ getLabel(idx) }}</span>
        <div class="efi-content">
          <button @click.prevent="e => changeStep(step, idx, e)" class="efi-item" type="button">
            <i class="efi-item-icon di-icon-click"></i>
            <span class="efi-item-text">
              {{ step.eventName }}
            </span>
          </button>
        </div>
        <div class="dropdown">
          <button class="efi-item dropdown-toggle" data-toggle="dropdown" type="button">
            <span class="efi-item-text">
              <template v-if="model.aggregationType">
                {{ AggregationAsMap[model.aggregationType] }}
              </template>
              <template v-else>None</template>
            </span>
          </button>
          <div class="dropdown-menu">
            <vuescroll>
              <div style="max-height: 300px">
                <a @click.prevent="model.aggregationType = agg" v-for="agg in aggTypes" :key="agg" href="#" class="dropdown-item">
                  {{ AggregationAsMap[agg] }}
                </a>
              </div>
            </vuescroll>
          </div>
        </div>
        <a @click.prevent="removeStep(idx)" href="#" class="efi-action efi-action-danger">
          <i class="di-icon-delete"></i>
        </a>
      </div>
      <div class="event-filters-item mb-0">
        <DiButton @click.prevent="addStep" id="efc-add" title="Add">
          <i class="di-icon-add"></i>
        </DiButton>
      </div>
    </CdpBlock>
    <!--    <CdpBlock :title="filterTitle" collapsed class="event-filters-container mb-2px" @update:collapsed="onCohortBlockCollapse">-->
    <!--      <div v-for="(filter, idx) in model.filters" :key="idx" class="event-filters-item">-->
    <!--        &lt;!&ndash;        <span class="efi-group">{{ idx + 1 }}</span>&ndash;&gt;-->
    <!--        <div class="efi-content">-->
    <!--          <button @click.prevent="e => changeFilter(idx, filter.isCohort, e)" class="efi-item" type="button">-->
    <!--            <template v-if="filter.isCohort">-->
    <!--              <i class="efi-item-icon di-icon-cohort"></i>-->
    <!--              <span class="efi-item-text"> Users in {{ filter.cohort.name || 'noname' }} </span>-->
    <!--            </template>-->
    <!--            <template v-else>-->
    <!--              <i class="efi-item-icon di-icon-click"></i>-->
    <!--              <span class="efi-item-text">-->
    <!--                {{ filter.eventName }}-->
    <!--              </span>-->
    <!--            </template>-->
    <!--          </button>-->
    <!--        </div>-->
    <!--        <a @click.prevent="removeFilter(idx)" href="#" class="efi-action efi-action-danger">-->
    <!--          <i class="di-icon-delete"></i>-->
    <!--        </a>-->
    <!--      </div>-->
    <!--      <div class="event-filters-item mb-0">-->
    <!--        <DiButton @click.prevent="addFilter" id="efc-add" title="Add">-->
    <!--          <i class="di-icon-add"></i>-->
    <!--        </DiButton>-->
    <!--      </div>-->
    <!--    </CdpBlock>-->
    <!--    <CdpBlock :title="breakdownTitle" collapsed class="event-filters-container" @update:collapsed="onFilterBlockCollapse">-->
    <!--      <div v-for="(breakdown, idx) in model.breakdowns" :key="idx" class="event-filters-item">-->
    <!--        &lt;!&ndash;        <span class="efi-group">{{ idx + 1 }}</span>&ndash;&gt;-->
    <!--        <div class="efi-content">-->
    <!--          <button @click.prevent="e => changeBreakdown(breakdown, e)" class="efi-item" type="button">-->
    <!--            <i class="efi-item-icon di-icon-cohort"></i>-->
    <!--            <span class="efi-item-text">-->
    <!--              {{ breakdown.name || 'noname' }}-->
    <!--            </span>-->
    <!--          </button>-->
    <!--        </div>-->
    <!--        <a @click.prevent="removeBreakdown(breakdown)" href="#" class="efi-action efi-action-danger">-->
    <!--          <i class="di-icon-delete"></i>-->
    <!--        </a>-->
    <!--      </div>-->
    <!--      <div class="event-filters-item mb-0">-->
    <!--        <DiButton @click.prevent="addBreakdown" id="efc-add" title="Add">-->
    <!--          <i class="di-icon-add"></i>-->
    <!--        </DiButton>-->
    <!--      </div>-->
    <!--    </CdpBlock>-->
    <SelectStepPopover ref="selectStepPopover"></SelectStepPopover>
  </div>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { CohortInfo } from '@core/cdp';
import { EventAnalysisInfo, EventAnalysisStep } from './EventAnalysisInfo';
import { FunctionType } from '@core/common/domain';
import { AggregationFunctionTypes } from '@/shared';
import CdpBlock from '../cdp-block/CdpBlock.vue';
import { EventFilter } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import SelectStepPopover, { TabType } from '@/screens/cdp/components/select-step-popover/SelectStepPopover.vue';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    PopoverV2,
    CdpBlock,
    SelectStepPopover
  }
})
export default class ManageEventAnalysis extends Vue {
  private model: EventAnalysisInfo = EventAnalysisInfo.default();

  @Ref()
  private readonly selectStepPopover!: SelectStepPopover;

  private get breakdownTitle() {
    return ['BREAKDOWNS', this.model.breakdowns.length ? ` (${this.model.breakdowns.length})` : ''].join('');
  }

  private get filterTitle() {
    return ['FILTERS', this.model.filters.length ? ` (${this.model.filters.length})` : ''].join('');
  }

  private readonly AggregationAsMap = {
    [FunctionType.Count]: AggregationFunctionTypes.countAll,
    [FunctionType.CountDistinct]: AggregationFunctionTypes.countOfDistinct
  };

  private get aggTypes(): FunctionType[] {
    return Object.keys(this.AggregationAsMap) as FunctionType[];
  }

  mounted() {
    this.initData();
  }

  private initData() {
    this.model = EventAnalysisInfo.default();
  }

  private getLabel(index: number) {
    // fixme: label will break
    return String.fromCharCode(65 + index);
  }

  private addStep(e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      callback: (eventName: string) => {
        this.model.addStep(EventAnalysisStep.fromEventName(eventName));
        TrackingUtils.track(TrackEvents.EventAnalysisUpdateEvents, { events: this.model.steps.map(filter => filter.eventName).join(',') });
      }
    });
  }

  private changeStep(step: EventAnalysisStep, index: number, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event], {
      callback: (eventName: string) => {
        this.model.updateStep(index, EventAnalysisStep.fromEventName(eventName));
        TrackingUtils.track(TrackEvents.EventAnalysisUpdateEvents, {
          events: this.model.steps.map(filter => filter.eventName).join(',')
        });
      }
    });
  }

  private removeStep(index: number) {
    this.model.removeStepAt(index);
    TrackingUtils.track(TrackEvents.EventAnalysisUpdateEvents, { events: this.model.steps.map(filter => filter.eventName).join(',') });
  }

  private addBreakdown(e: MouseEvent) {
    // todo: fix breakdown
  }

  private changeBreakdown(index: number, e: MouseEvent) {
    // todo: change breakdown
  }

  private removeBreakdown(index: number) {
    // todo: remove breakdown
  }

  private addFilter(e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Cohort], {
      callback: (event: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Event: {
            const eventFilter: EventFilter = EventFilter.fromEventName(event as string);
            this.model.addFilter(eventFilter);
            break;
          }
          case TabType.Cohort: {
            const eventFilter: EventFilter = EventFilter.fromCohort(event as CohortInfo);
            this.model.addFilter(eventFilter);
            break;
          }
        }
      }
    });
  }

  private changeFilter(index: number, isCohort: boolean, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Cohort], {
      selectedTab: isCohort ? TabType.Cohort : TabType.Event,
      callback: (event: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Event: {
            this.model.updateFilter(index, EventFilter.fromEventName(event as string));
            break;
          }
          case TabType.Cohort: {
            this.model.updateFilter(index, EventFilter.fromCohort(event as CohortInfo));
            break;
          }
        }
      }
    });
  }

  private removeFilter(index: number) {
    this.model.removeFilterAt(index);
  }

  @Watch('model', { deep: true })
  private changeModel() {
    this.$emit('input', this.model);
  }

  private onEventBlockCollapse(collapse: boolean) {
    this.$emit('collapse:event', collapse);
  }
  private onFilterBlockCollapse(collapse: boolean) {
    this.$emit('collapse:filter', collapse);
  }
  private onCohortBlockCollapse(collapse: boolean) {
    this.$emit('collapse:cohort', collapse);
  }
}
</script>
<style lang="scss">
.manage-event-analysis {
  $spacing: 6px;

  .mb-2px {
    margin-bottom: 2px !important;
  }

  .input-group {
    //.form-control,
    .input-group-text {
      width: 30px;
      background-color: var(--input-background-color);
    }
  }

  .event-filters-container {
    display: flex;
    flex-direction: column;
    position: relative;

    &.disabled {
      opacity: 0.7;

      &::after {
        content: '';
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 1;
        background: transparent;
      }
    }

    .event-filters-item {
      display: flex;
      //flex-wrap: wrap;
      margin-bottom: 8px;
      align-items: flex-start;

      .dropdown {
        display: inline-block;
      }
    }

    .efi {
      &-group,
      &-item,
      &-action {
        display: inline-flex;
        align-items: center;
        min-height: 34px;
        text-decoration: none;
        border: none;
        background: none;
        margin: 4px 10px 4px 0;
      }

      &-content {
        display: flex;
        justify-content: flex-start;
        flex-wrap: wrap;

        .efi-item {
          white-space: nowrap;
        }
      }

      &-group {
        font-weight: 500;
        width: 20px;
        //margin-right: 10px;
      }

      &-item {
        background-color: var(--active-color);
        padding: 6px 12px;
        border-radius: 4px;
        //margin-right: 8px;
        text-decoration: none;

        &-input {
          background: none;
          border: none;
          width: 60px;
          font-weight: 500;
        }
      }

      &-action {
        font-size: 18px;
        padding: 0 8px;
        color: var(--text-color);
        margin-right: 0;

        &:hover {
          background-color: #fafafb;
          border-radius: 4px;
        }

        &-danger {
          &:hover {
            color: var(--danger);
          }
        }
      }

      &-item-icon {
        margin-right: 8px;
      }

      &-event-icon {
        display: inline-block;
        width: 16px;
        height: 16px;
        opacity: 0.1;
        border-radius: 4px;
        background-color: var(--accent);
      }

      &-item-text {
        color: var(--text-color);
        font-weight: 500;
      }
    }

    .di-calendar-input-container .input-calendar {
      height: auto !important;
    }
  }

  .dropdown-menu-events {
    width: 320px;
    //padding: 10px;
  }
}
</style>
