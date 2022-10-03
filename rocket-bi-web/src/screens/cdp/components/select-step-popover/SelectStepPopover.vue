<template>
  <SelectionPopover ref="popover" :tabs="tabs" v-model="selectedTab" @hidden="reset">
    <template :slot="TabType.Event" slot-scope="{ keyword }">
      <CdpSelectionListing
        key="event"
        :keyword="keyword"
        :loader="eventLoader"
        :isShowAnyEvent="isShowAnyEvent"
        title-name="ALL EVENT"
        :is-show-title="tabs.length === 1"
        @select="selectEvent"
      >
        <template #any-event="{select}">
          <a @click.prevent="select(AnyEvent)" href="#" class="list-events-item">
            <i class="di-icon-click"></i>
            Any Event
          </a>
        </template>
      </CdpSelectionListing>
    </template>
    <template :slot="TabType.Screen" slot-scope="{ keyword }">
      <CdpSelectionListing
        key="screen"
        name="screen"
        :keyword="keyword"
        :loader="screenLoader"
        :isShowAnyEvent="isShowAnyScreen"
        :is-show-title="tabs.length === 1"
        title-name="ALL SCREEN"
        @select="selectScreen"
      >
        <template #any-event="{select}">
          <a @click.prevent="select(AnyScreen)" href="#" class="list-events-item">
            <i class="di-icon-click"></i>
            Any Screen
          </a>
        </template>
      </CdpSelectionListing>
    </template>
    <template :slot="TabType.Cohort" slot-scope="{ keyword }">
      <CdpSelectionListing
        key="cohort"
        :keyword="keyword"
        :loader="cohortLoader"
        :isShowAnyEvent="false"
        :is-show-title="tabs.length === 1"
        title-name="ALL COHORT"
        @select="selectCohort"
      >
      </CdpSelectionListing>
    </template>
  </SelectionPopover>
</template>
<script lang="ts">
import Vue from 'vue';
import { SelectOption, Status } from '@/shared';
import Component from 'vue-class-component';
import SelectionPopover from '@/screens/cdp/components/select-step-popover/SelectionPopover.vue';
import { Ref } from 'vue-property-decorator';
import { CohortService, CohortInfo, EventExplorerService, ExploreType } from '@core/cdp';
import { ListUtils, RandomUtils } from '@/utils';
import { IdGenerator } from '@/utils/IdGenerator';
import CdpSelectionListing from './CdpSelectionListing.vue';
import { CdpCohortLoader, CdpEventLoader, CdpSelectionLoader } from '@/screens/cdp/components/select-step-popover/CdpSelectionLoader';
import { Di } from '@core/common/modules';

export enum TabType {
  Event = 'Event',
  Screen = 'Screen',
  Cohort = 'Cohort'
}

export const ANY_EVENT = `any_event_${RandomUtils.nextString()}`;
export const ANY_SCREEN = `any_screen_${RandomUtils.nextString()}`;

@Component({
  components: { SelectionPopover, CdpSelectionListing }
})
export default class SelectStepPopover extends Vue {
  private readonly TabType = TabType;
  private readonly AnyEvent = ANY_EVENT;
  private readonly AnyScreen = ANY_SCREEN;
  private readonly Status = Status;

  private selectedTab = TabType.Event;
  private isShowAnyEvent = false;
  private isShowAnyScreen = false;
  private callback?: (event: string | CohortInfo, tabType: TabType) => void;

  private reset() {
    this.callback = undefined;
  }

  private readonly TAB_AS_MAP: Map<TabType, SelectOption> = new Map([
    [
      TabType.Event,
      {
        id: TabType.Event,
        displayName: 'ALL EVENT'
      }
    ],
    [
      TabType.Screen,
      {
        id: TabType.Screen,
        displayName: 'ALL SCREEN'
      }
    ],
    [
      TabType.Cohort,
      {
        id: TabType.Cohort,
        displayName: 'ALL COHORT'
      }
    ]
  ]);

  private tabs: SelectOption[] = [];
  private eventLoader: CdpSelectionLoader<string>;
  private screenLoader: CdpSelectionLoader<string>;
  private cohortLoader: CdpSelectionLoader<CohortInfo>;

  constructor() {
    super();
    this.eventLoader = new CdpEventLoader(Di.get(EventExplorerService), ExploreType.Event);
    this.screenLoader = new CdpEventLoader(Di.get(EventExplorerService), ExploreType.Screen);
    this.cohortLoader = new CdpCohortLoader(Di.get(CohortService));
  }

  @Ref()
  private readonly popover!: SelectionPopover;

  private selectEvent(event: string) {
    if (this.callback) {
      this.callback(event, TabType.Event);
    } else {
      this.$emit('select:event', event, TabType.Event);
    }
  }

  private selectScreen(screen: string) {
    if (this.callback) {
      this.callback(screen, TabType.Screen);
    } else {
      this.$emit('select:screen', screen, TabType.Screen);
    }
  }

  private selectCohort(cohort: CohortInfo) {
    if (this.callback) {
      this.callback(cohort, TabType.Cohort);
    } else {
      this.$emit('select:cohort', cohort, TabType.Cohort);
    }
  }

  /**
   * tự động hide options any
   */
  show(
    target: EventTarget | HTMLElement | any,
    tabs: TabType[],
    options?: { isShowAnyEvent?: boolean; isShowAnyScreen?: boolean; callback?: (data: any, stepType: TabType) => void; selectedTab?: TabType }
  ) {
    this.tabs = this.getTabOptions(tabs);
    this.selectedTab = options?.selectedTab ?? ListUtils.getHead(tabs) ?? TabType.Event;
    this.isShowAnyEvent = options?.isShowAnyEvent ?? false;
    this.isShowAnyScreen = options?.isShowAnyScreen ?? false;
    this.callback = options?.callback;
    this.popover.show(target as HTMLElement);
  }

  private getEventId(eventName: string) {
    return IdGenerator.generateKey(['event', eventName]);
  }

  private getScreenId(screenName: string) {
    return IdGenerator.generateKey(['screen', screenName]);
  }

  private getTabOptions(tabs: TabType[]): SelectOption[] {
    return tabs.map(tab => this.TAB_AS_MAP.get(tab)!);
  }
}
</script>
