/*
 * @author: tvc12 - Thien Vi
 * @created: 4/5/22, 12:04 PM
 */

import { CohortFilter, EventSequence, ExploreType, RangeValue, TimeMetric } from '@core/CDP';
import { EventFilter } from '@/screens/CDP/components/ManagePathExplorer/PathExplorer.entity';
import { CohortId } from '@core/domain';

export class InitEventExplorerRequest {
  startValue: string;
  fromLevel: number;
  toLevel: number;
  dateRange: RangeValue<number>;
  exploreType: ExploreType;
  exploreValues: string[];
  cohortIds: CohortId[];

  constructor(
    startValue: string,
    fromLevel: number,
    toLevel: number,
    dateRange: RangeValue<number>,
    exploreType: ExploreType,
    exploreValues: string[],
    cohortIds: CohortId[]
  ) {
    this.startValue = startValue;
    this.fromLevel = fromLevel;
    this.toLevel = toLevel;
    this.dateRange = dateRange;
    this.exploreType = exploreType;
    this.exploreValues = exploreValues;
    this.cohortIds = cohortIds;
  }
}

export enum ExploreDirection {
  Before = 'Backward',
  After = 'Forward'
}

export class ExploreEventRequest {
  fromSequences: EventSequence[];
  curLevel: number;
  numNextLevel: number;
  direction: ExploreDirection;
  dateRange: RangeValue<number>;
  exploreType: ExploreType;
  numTopElems: number;
  exploreValues: string[];
  cohortIds: CohortId[];
  lastLayerTotal: number;

  constructor(
    fromSequences: EventSequence[],
    curLevel: number,
    numNextLevel: number,
    direction: ExploreDirection,
    dateRange: RangeValue<number>,
    exploreType: ExploreType,
    numTopElems: number,
    exploreValues: string[],
    cohortIds: CohortId[],
    lastLayerTotal: number
  ) {
    this.fromSequences = fromSequences;
    this.curLevel = curLevel;
    this.numNextLevel = numNextLevel;
    this.direction = direction;
    this.dateRange = dateRange;
    this.exploreType = exploreType;
    this.numTopElems = numTopElems;
    this.exploreValues = exploreValues;
    this.cohortIds = cohortIds;
    this.lastLayerTotal = lastLayerTotal;
  }

  static exploreBefore(
    fromSequences: EventSequence[],
    curLevel: number,
    numNextLevel: number,
    dateRange: RangeValue<number>,
    exploreType: ExploreType,
    exploreValues: string[],
    cohortIds: CohortId[],
    lastLayerTotal: number,
    numTopElems = 5
  ): ExploreEventRequest {
    return new ExploreEventRequest(
      fromSequences,
      curLevel,
      numNextLevel,
      ExploreDirection.Before,
      dateRange,
      exploreType,
      numTopElems,
      exploreValues,
      cohortIds,
      lastLayerTotal
    );
  }

  static exploreAfter(
    fromSequences: EventSequence[],
    curLevel: number,
    numNextLevel: number,
    dateRange: RangeValue<number>,
    exploreType: ExploreType,
    exploreValues: string[],
    cohortIds: CohortId[],
    lastLayerTotal: number,
    numTopElems = 5
  ): ExploreEventRequest {
    return new ExploreEventRequest(
      fromSequences,
      curLevel,
      numNextLevel,
      ExploreDirection.After,
      dateRange,
      exploreType,
      numTopElems,
      exploreValues,
      cohortIds,
      lastLayerTotal
    );
  }
}

export class FunnelAnalysisRequest {
  steps: string[];
  dateRange: RangeValue<number>;
  exploreType: ExploreType;
  exploreValues: string[];
  cohortIds: CohortId[];

  constructor(steps: string[], dateRange: RangeValue<number>, exploreType: ExploreType, exploreValues: string[], cohortIds: CohortId[]) {
    this.steps = steps;
    this.dateRange = dateRange;
    this.exploreType = exploreType;
    this.exploreValues = exploreValues;
    this.cohortIds = cohortIds;
  }
}
