import { CohortInfo, EventNode, ExploreType } from '@core/CDP';
import { ListUtils, RandomUtils } from '@/utils';
import { CohortId } from '@core/domain';
import Vue from 'vue';
import { cloneDeep, groupBy } from 'lodash';
import { Log } from '@core/utils';
import { IdGenerator } from '@/utils/id_generator';

/* eslint-disable @typescript-eslint/no-use-before-define */
export enum EventFilterType {
  Event = 'Event',
  Cohort = 'Cohort'
}

export class EventFilter {
  eventType: EventFilterType;
  cohort!: CohortInfo;
  eventName!: string;

  constructor(eventType: EventFilterType, cohort: CohortInfo, eventName: string) {
    this.eventType = eventType;
    this.cohort = cohort;
    this.eventName = eventName;
  }

  static fromCohort(cohort: CohortInfo) {
    return new EventFilter(EventFilterType.Cohort, cohort, '');
  }

  static fromEventName(eventName: string) {
    return new EventFilter(EventFilterType.Event, CohortInfo.default(), eventName);
  }

  get isCohort() {
    return this.eventType === EventFilterType.Cohort;
  }

  get isEvent() {
    return this.eventType === EventFilterType.Event;
  }
}

export class PathExplorerStep {
  private static counter = 1;
  id: string;
  eventName: string;
  exploreType: ExploreType;

  constructor(eventName: string, exploreType: ExploreType) {
    this.id = [eventName.toLocaleLowerCase().replace(/\s/g, '-'), PathExplorerStep.counter++].join('_');
    this.eventName = eventName;
    this.exploreType = exploreType;
  }
}

export class PathExplorerInfo {
  steps: PathExplorerStep[];
  filters: EventFilter[];
  breakdowns: any[] = [];

  constructor(steps: PathExplorerStep[], filters: EventFilter[]) {
    this.steps = steps;
    this.filters = filters;
  }

  getExplorerType(): ExploreType {
    return ListUtils.getHead(this.steps)?.exploreType || ExploreType.Event;
  }

  getExplorerValues(): string[] {
    return this.filters.filter(filter => filter.isEvent).map(filter => filter.eventName);
  }

  getCohortIds(): CohortId[] {
    return this.filters.filter(filter => filter.isCohort).map(filter => filter.cohort.id!);
  }

  removeFilterAt(index: number) {
    this.filters = ListUtils.removeAt(this.filters, index);
  }

  removeStepAt(index: number) {
    this.steps = ListUtils.removeAt(this.steps, index);
    if (ListUtils.isEmpty(this.steps)) {
      // remove filter when steps is empty
      this.filters = [];
    }
  }

  addStep(step: PathExplorerStep) {
    this.steps.push(step);
  }

  addFilter(filter: EventFilter) {
    this.filters.push(filter);
  }

  updateFilter(index: number, filter: EventFilter) {
    Vue.set(this.filters, index, filter);
  }

  static default() {
    return new PathExplorerInfo([], []);
  }
}

export class EventExplorerResult {
  constructor(public breakdowns: EventBreakdown[], public step: EventStepResult) {}

  static fromObject(obj: any): EventExplorerResult {
    const breakdowns: EventBreakdown[] = obj.breakdowns.map((breakdown: any) => EventBreakdown.fromObject(breakdown));
    const step: EventStepResult = EventStepResult.fromObject(obj.step);
    return new EventExplorerResult(breakdowns, step);
  }

  static loading() {
    return new EventExplorerResult([], EventStepResult.default());
  }
}

export class EventBreakdown {
  constructor(public breakdownId: string, public breakdownName: string) {}

  static fromObject(obj: EventBreakdown & object) {
    return new EventBreakdown(obj.breakdownId, obj.breakdownName);
  }
}

export class EventStepResult {
  constructor(
    public id: string,
    public eventName: string,
    public total: EventStepValue,
    public dropOff: EventStepValue | null,
    public beforeSteps: SubEventExplorerData[],
    public afterSteps: SubEventExplorerData[],
    public isLoading: boolean,
    public totalValue: number
  ) {}

  showLoading(isNested: boolean) {
    this.isLoading = true;
    if (isNested) {
      this.beforeSteps.forEach(step => step.showLoading(true));
      this.afterSteps.forEach(step => step.showLoading(true));
    }
  }

  static fromObject(obj: EventStepResult & object): EventStepResult {
    const total: EventStepValue = EventStepValue.fromObject(obj.total);
    const dropOff: EventStepValue | null = obj.dropOff ? EventStepValue.fromObject(obj.dropOff) : null;
    const beforeSteps = obj.beforeSteps.map(beforeStep => SubEventExplorerData.fromObject(beforeStep));
    const afterSteps = obj.afterSteps.map(afterStep => SubEventExplorerData.fromObject(afterStep));
    return new EventStepResult(obj.id, obj.eventName, total, dropOff, beforeSteps, afterSteps, false, obj.totalValue);
  }

  static default(): EventStepResult {
    return new EventStepResult(RandomUtils.nextString(), 'default', EventStepValue.default(), EventStepValue.default(), [], [], true, 0);
  }
}

export class EventStepValue {
  constructor(public count: number, public percent: number) {}

  static fromObject(obj: EventStepValue & object): EventStepValue {
    return new EventStepValue(obj.count, obj.percent);
  }

  static default() {
    return new EventStepValue(0, 0);
  }

  static fromResponse(step: EventNode) {
    return new EventStepValue(step.value, 100);
  }
}

export class SubEventExplorerData {
  public id: string;
  public events: SubEventStepValue[];
  public other: EventStepValue | null;
  public dropOff: EventStepValue | null;
  public isLoading: boolean;

  get orderId(): string {
    return IdGenerator.generateKey([this.id, 'order']);
  }

  get dropOffId(): string {
    return IdGenerator.generateKey([this.id, 'drop-off']);
  }

  constructor(id: string, events: SubEventStepValue[], other: EventStepValue | null, dropOff: EventStepValue | null, isLoading = false) {
    this.id = id;
    this.events = events;
    this.other = other;
    this.dropOff = dropOff;
    this.isLoading = isLoading;
  }

  showLoading(isNested: boolean) {
    this.isLoading = true;
  }

  static fromObject(obj: SubEventExplorerData & object): SubEventExplorerData {
    const events: SubEventStepValue[] = obj.events.map(event => SubEventStepValue.fromObject(event));
    const other: EventStepValue | null = obj.other ? EventStepValue.fromObject(obj.other) : null;
    const dropOff: EventStepValue | null = obj.dropOff ? EventStepValue.fromObject(obj.dropOff) : null;
    return new SubEventExplorerData(obj.id, events, other, dropOff, false);
  }

  static default(): SubEventExplorerData {
    return new SubEventExplorerData(RandomUtils.nextString(), [SubEventStepValue.default()], EventStepValue.default(), EventStepValue.default(), true);
  }
}

export class SubEventStepValue {
  public id: string;
  public eventName: string;
  public value: EventStepValue;
  public from?: string;
  public to?: string;

  constructor(id: string, eventName: string, value: EventStepValue, from?: string, to?: string) {
    this.id = id;
    this.eventName = eventName;
    this.value = value;
    this.from = from;
    this.to = to;
  }

  static fromObject(obj: any) {
    return new SubEventStepValue(obj.id, obj.eventName, EventStepValue.fromObject(obj.value), obj.from, obj.to);
  }

  static default(): SubEventStepValue {
    return new SubEventStepValue(RandomUtils.nextString(), 'default', EventStepValue.default(), undefined, undefined);
  }

  static mergeDuplicateEvents(events: SubEventStepValue[]) {
    const listEventsById = groupBy(events, value => value.eventName);
    return Object.entries(listEventsById).map(([key, subStepValues]) => {
      const id: string = ListUtils.getHead(subStepValues)?.id ?? '';
      const value: EventStepValue = this.sumEventStepValues(subStepValues.map(stepValue => stepValue.value));

      return new SubEventStepValue(id, key, value, void 0, void 0);
    });
  }

  private static sumEventStepValues(values: EventStepValue[]): EventStepValue {
    const stepValue = new EventStepValue(0, 0);
    values.forEach(value => {
      stepValue.count += value.count;
      stepValue.percent += value.percent;
    });
    return stepValue;
  }
}
