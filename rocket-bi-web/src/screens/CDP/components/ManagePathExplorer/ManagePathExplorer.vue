<template>
  <div v-if="model">
    <CdpBlock title="SELECT START STEP" class="event-filters-container mb-2px">
      <div v-for="(step, idx) in model.steps" :key="idx" class="event-filters-item">
        <span class="efi-group">{{ idx + 1 }}</span>
        <div class="efi-content">
          <button @click.prevent="e => changeStep(step, e)" class="efi-item" type="button">
            <i class="efi-item-icon di-icon-click"></i>
            <span class="efi-item-text">
              {{ step.eventName }}
            </span>
          </button>
        </div>
        <a @click.prevent="removeStep(idx)" href="#" class="efi-action efi-action-danger">
          <i class="di-icon-delete"></i>
        </a>
      </div>
      <div v-if="model.steps.length === 0" class="event-filters-item mb-0">
        <DiButton @click.prevent="addStep" id="efc-add" title="Add">
          <i class="di-icon-add"></i>
        </DiButton>
      </div>
    </CdpBlock>
    <CdpBlock :title="filterTitle" collapsed class="event-filters-container mb-2px">
      <div v-for="(filter, idx) in model.filters" :key="idx" class="event-filters-item">
        <!--        <span class="efi-group">{{ idx + 1 }}</span>-->
        <div class="efi-content">
          <button @click.prevent="e => changeFilter(idx, filter.isCohort, e)" class="efi-item" type="button">
            <template v-if="filter.isCohort">
              <i class="efi-item-icon di-icon-cohort"></i>
              <span class="efi-item-text"> Users in {{ filter.cohort.name || 'noname' }} </span>
            </template>
            <template v-else>
              <i class="efi-item-icon di-icon-click"></i>
              <span class="efi-item-text">
                {{ filter.eventName }}
              </span>
            </template>
          </button>
        </div>
        <a @click.prevent="removeFilter(idx)" href="#" class="efi-action efi-action-danger">
          <i class="di-icon-delete"></i>
        </a>
      </div>
      <div class="event-filters-item mb-0">
        <DiButton @click.prevent="addFilter" id="efc-add" title="Add">
          <i class="di-icon-add"></i>
        </DiButton>
      </div>
    </CdpBlock>
    <SelectStepPopover ref="selectStepPopover"></SelectStepPopover>
  </div>
</template>
<script lang="ts">
import { Component, Model, Ref, Vue, Watch } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';
import { CohortInfo, ExploreType } from '@core/CDP';
import { EventFilter, PathExplorerInfo, PathExplorerStep } from './PathExplorer.entity';
import CdpBlock from '../CdpBlock/CdpBlock.vue';
import { Inject } from 'typescript-ioc';
import { EventExplorerService } from '@core/CDP/Service/EventExploreService';
import SelectStepPopover, { TabType } from '@/screens/CDP/components/SelectStepPopover/SelectStepPopover.vue';
import { VerticalScrollConfigs } from '@/shared';
import { Log } from '@core/utils';
import { DomUtils } from '@/utils';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: {
    CdpBlock,
    PopoverV2,
    SelectStepPopover
  }
})
export default class ManagePathExplorer extends Vue {
  private readonly VerticalScrollConfig = VerticalScrollConfigs;

  @Model('change', { type: Object, default: () => null })
  private readonly value!: PathExplorerInfo | null;
  model: PathExplorerInfo = PathExplorerInfo.default();

  @Ref()
  private readonly selectStepPopover!: SelectStepPopover;

  @Inject
  private readonly eventExplorerService!: EventExplorerService;

  private get breakdownTitle() {
    return ['BREAKDOWNS', this.model.breakdowns.length ? ` (${this.model.breakdowns.length})` : ''].join('');
  }

  private get filterTitle() {
    return ['FILTERS', this.model.filters.length ? ` (${this.model.filters.length})` : ''].join('');
  }

  private addStep(e: MouseEvent) {
    // e.currentTarget ??
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Screen], {
      callback: (eventName: string, tabType: TabType) => {
        const exploreType = this.toExploreType(tabType);
        this.model.addStep(new PathExplorerStep(eventName, exploreType));
        TrackingUtils.track(TrackEvents.PathExplorerSelectStartStep, {
          name: eventName,
          type: exploreType
        });
      }
    });
  }

  private changeStep(step: PathExplorerStep, e: MouseEvent) {
    this.selectStepPopover.show(e.currentTarget ?? e.target, [TabType.Event, TabType.Screen], {
      callback: (eventName: string, tabType: TabType) => {
        step.eventName = eventName;
        step.exploreType = this.toExploreType(tabType);
        TrackingUtils.track(TrackEvents.PathExplorerSelectStartStep, {
          name: step.eventName,
          type: step.exploreType
        });
      }
    });
  }

  private toExploreType(tabType: TabType) {
    switch (tabType) {
      case TabType.Event:
        return ExploreType.Event;
      case TabType.Screen:
        return ExploreType.Screen;
      default:
        Log.error('toExploreType::not found tab type ', tabType);
        return ExploreType.Event;
    }
  }

  //remove root event
  @Track(TrackEvents.PathExplorerRemoveStartStep, {
    type: (_: ManagePathExplorer, args: any) => _.model.steps[args[0]].exploreType,
    name: (_: ManagePathExplorer, args: any) => _.model.steps[args[0]].eventName
  })
  private removeStep(index: number) {
    this.model.removeStepAt(index);
  }

  private addFilter(e: MouseEvent) {
    const eventOrScreenTab = this.getEventOrScreenTab(this.model.getExplorerType());
    this.selectStepPopover.show(e.currentTarget ?? e.target, [eventOrScreenTab, TabType.Cohort], {
      callback: (event: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Screen:
          case TabType.Event: {
            const eventFilter: EventFilter = EventFilter.fromEventName(event as string);
            this.model.addFilter(eventFilter);
            TrackingUtils.track(TrackEvents.PathExplorerAddEventFilter, {
              name: eventFilter.eventName
            });
            break;
          }
          case TabType.Cohort: {
            const eventFilter: EventFilter = EventFilter.fromCohort(event as CohortInfo);
            this.model.addFilter(eventFilter);
            TrackingUtils.track(TrackEvents.PathExplorerAddCohortFilter, {
              name: eventFilter.eventName
            });
            break;
          }
        }
      }
    });
  }

  private changeFilter(index: number, isCohort: boolean, e: MouseEvent) {
    const eventOrScreenTab = this.getEventOrScreenTab(this.model.getExplorerType());
    const selectedTab = isCohort ? TabType.Cohort : eventOrScreenTab;
    this.selectStepPopover.show(e.currentTarget ?? e.target, [eventOrScreenTab, TabType.Cohort], {
      selectedTab: selectedTab,
      callback: (event: string | CohortInfo, tabType: TabType) => {
        switch (tabType) {
          case TabType.Screen:
          case TabType.Event: {
            this.model.updateFilter(index, EventFilter.fromEventName(event as string));
            TrackingUtils.track(TrackEvents.PathExplorerUpdateFilter, {
              old_type: this.model.filters[index].eventType,
              old_name: this.model.filters[index].eventName,
              new_name: EventFilter.fromEventName(event as string).eventName,
              new_type: EventFilter.fromEventName(event as string).eventType
            });
            break;
          }
          case TabType.Cohort: {
            this.model.updateFilter(index, EventFilter.fromCohort(event as CohortInfo));
            TrackingUtils.track(TrackEvents.PathExplorerUpdateFilter, {
              old_type: this.model.filters[index].eventType,
              old_name: this.model.filters[index].eventName,
              new_name: EventFilter.fromCohort(event as CohortInfo).eventName,
              new_type: EventFilter.fromCohort(event as CohortInfo).eventType
            });
            break;
          }
        }
      }
    });
  }

  @Track(TrackEvents.PathExplorerRemoveFilter, {
    type: (_: ManagePathExplorer, args: any) => _.model.filters[args[0]].eventType,
    name: (_: ManagePathExplorer, args: any) => _.model.filters[args[0]].eventName
  })
  private removeFilter(index: number) {
    if (this.model) {
      this.model.removeFilterAt(index);
    }
  }

  private getEventOrScreenTab(exploreType: ExploreType): TabType {
    if (exploreType === ExploreType.Screen) {
      return TabType.Screen;
    } else {
      return TabType.Event;
    }
  }

  private addBreakdown(e: MouseEvent) {
    // todo: handle add breakdown
  }

  private changeBreakdown(breakdown: CohortInfo, e: MouseEvent) {
    // todo: handle change breakdown
  }

  private removeBreakdown(breakdown: CohortInfo) {
    if (this.model) {
      this.model.breakdowns = this.model.breakdowns.filter(b => b !== breakdown);
    }
  }

  @Watch('model', { deep: true })
  private changeModel() {
    this.$emit('change', this.model);
  }
}
</script>
<style lang="scss" scoped>
.mb-2px {
  margin-bottom: 2px !important;
}

//@import '~@/themes/scss/di-variables.scss';
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

  ::v-deep .di-calendar-input-container .input-calendar {
    height: auto !important;
  }
}

$spacing: 6px;
.dropdown-menu-events {
  width: 320px;
  padding: 10px;
}

.list-events {
  list-style: none;
  padding: 0;
  margin-bottom: 16px !important;

  &.mb-0 {
    margin-bottom: 0px !important;
  }

  li {
    display: flex;
    align-items: center;
    width: 100%;
    //margin-bottom: 12px;
  }

  &-item {
    display: flex;
    align-items: center;
    width: 100%;
    color: var(--text-color);
    text-decoration: none;
    padding: 6px $spacing;

    [class^='di-icon-'] {
      width: 16px;
      display: inline-block;
      font-size: 16px;
      margin-right: 8px;
    }

    //&:before {
    //  content: '';
    //  display: inline-block;
    //  width: 16px;
    //  height: 16px;
    //  opacity: 0.1;
    //  border-radius: 4px;
    //  background-color: var(--accent);
    //  margin-right: 8px;
    //}
    &:hover {
      background-color: var(--input-background-color);
      border-radius: 4px;
    }
  }

  &-title {
    font-weight: 500;
    text-transform: uppercase;
    padding: 0 $spacing;
  }
}
</style>
