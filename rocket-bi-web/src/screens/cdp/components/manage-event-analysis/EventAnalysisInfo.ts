import { EventFilter } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import { ListUtils } from '@/utils';
import { CohortId, FunctionType } from '@core/common/domain';
import Vue from 'vue';
import { AggregationType } from '@core/cdp';

export class EventAnalysisStep {
  private static counter = 1;
  eventName: string;
  id!: string;

  constructor(eventName: string) {
    this.eventName = eventName;
    this.id = [eventName.toLocaleLowerCase().replace(/\s/g, '-'), EventAnalysisStep.counter++].join('_');
  }

  static fromEventName(eventName: string): EventAnalysisStep {
    return new EventAnalysisStep(eventName);
  }
}

export class EventAnalysisInfo {
  steps: EventAnalysisStep[] = [];
  filters: EventFilter[] = [];
  breakdowns: any[] = [];
  aggregationType: FunctionType;

  constructor(aggregationType: FunctionType, steps: EventAnalysisStep[], filters: EventFilter[]) {
    this.steps = steps;
    this.filters = filters;
    this.aggregationType = aggregationType;
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

  addStep(event: EventAnalysisStep) {
    this.steps.push(event);
  }

  updateStep(index: number, event: EventAnalysisStep) {
    Vue.set(this.steps, index, event);
  }

  addFilter(filter: EventFilter) {
    this.filters.push(filter);
  }

  updateFilter(index: number, filter: EventFilter) {
    Vue.set(this.filters, index, filter);
  }

  static default(): EventAnalysisInfo {
    return new EventAnalysisInfo(FunctionType.Count, [], []);
  }
}
