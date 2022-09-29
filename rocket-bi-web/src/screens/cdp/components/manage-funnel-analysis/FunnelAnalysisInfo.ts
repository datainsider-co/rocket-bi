import { EventFilter } from '@/screens/cdp/components/manage-path-explorer/PathExplorerInfo';
import { ListUtils } from '@/utils';
import { CohortId, FunctionType } from '@core/common/domain';
import Vue from 'vue';
import { IdGenerator } from '@/utils/IdGenerator';
import { ExploreType } from '@core/cdp';

export class FunnelAnalysisStep {
  private static counter = 1;
  eventName: string;
  id!: string;

  constructor(eventName: string) {
    this.eventName = eventName;
    const index = FunnelAnalysisStep.counter++;
    this.id = IdGenerator.generateKey([eventName.toLocaleLowerCase().replace(/\s/g, '-'), index.toString()], '-');
  }

  static fromEventName(eventName: string): FunnelAnalysisStep {
    return new FunnelAnalysisStep(eventName);
  }
}

export class FunnelAnalysisInfo {
  steps: FunnelAnalysisStep[];
  explorerType: ExploreType;

  constructor(explorerType: ExploreType, steps: FunnelAnalysisStep[]) {
    this.steps = steps;
    this.explorerType = explorerType;
  }

  addStep(event: FunnelAnalysisStep) {
    this.steps.push(event);
  }

  updateStep(index: number, event: FunnelAnalysisStep) {
    Vue.set(this.steps, index, event);
  }

  removeStepAt(index: number) {
    this.steps = ListUtils.removeAt(this.steps, index);
  }

  isEmpty(): boolean {
    return ListUtils.isEmpty(this.steps);
  }

  static default(): FunnelAnalysisInfo {
    return new FunnelAnalysisInfo(ExploreType.Event, []);
  }
}
