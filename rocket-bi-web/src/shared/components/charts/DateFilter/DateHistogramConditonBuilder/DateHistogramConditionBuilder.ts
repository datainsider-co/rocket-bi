import { DateConditionTypes, DateHistogramConditionTypes, DateTypes } from '@/shared';
import { Log } from '@core/utils';
///Build DateHistogramConditionTypes với 2 giá trị là condition và date <br>
///Example: Last + Year = Last_N_Year
export class DateHistogramConditionCreator {
  private readonly datePreferenceAsMap: Map<DateTypes, DateHistogramConditionTypes[]>;
  private readonly conditionPreferenceAsMap: Map<DateConditionTypes, DateHistogramConditionTypes[]>;
  private readonly partOfDateHistogramConditionAsMap: Map<DateHistogramConditionTypes, [DateConditionTypes, DateTypes | undefined]>;
  private date?: DateTypes;
  private condition?: DateConditionTypes;

  constructor(
    datePreferenceAsMap: Map<DateTypes, DateHistogramConditionTypes[]>,
    conditionPreferenceAsMap: Map<DateConditionTypes, DateHistogramConditionTypes[]>,
    partOfDateHistogramConditionAsMap: Map<DateHistogramConditionTypes, [DateConditionTypes, DateTypes | undefined]>
  ) {
    this.datePreferenceAsMap = datePreferenceAsMap;
    this.conditionPreferenceAsMap = conditionPreferenceAsMap;
    this.partOfDateHistogramConditionAsMap = partOfDateHistogramConditionAsMap;
  }

  withDateCondition(condition: DateConditionTypes): DateHistogramConditionCreator {
    this.condition = condition;
    return this;
  }

  withDate(date: DateTypes | undefined): DateHistogramConditionCreator {
    this.date = date;
    return this;
  }

  create(): DateHistogramConditionTypes | undefined {
    const partOfConditions: DateHistogramConditionTypes[] | undefined = this.condition ? this.conditionPreferenceAsMap.get(this.condition) : void 0;
    const partOfDates: DateHistogramConditionTypes[] | undefined = this.date ? this.datePreferenceAsMap.get(this.date) : void 0;
    Log.debug('create', partOfConditions, partOfDates);
    if (partOfConditions && partOfDates) {
      return partOfConditions.filter(condition => partOfDates.includes(condition))[0];
    } else if (partOfConditions) {
      return partOfConditions[0];
    } else {
      return void 0;
    }
  }

  separator(condition: DateHistogramConditionTypes): [DateConditionTypes, DateTypes | undefined] | undefined {
    return this.partOfDateHistogramConditionAsMap.get(condition);
  }

  preferenceOfCondition(condition: DateConditionTypes): Set<DateHistogramConditionTypes> {
    const preferenceOfCondition: DateHistogramConditionTypes[] | undefined = this.conditionPreferenceAsMap.get(condition);
    return preferenceOfCondition ? new Set(preferenceOfCondition) : new Set();
  }
}

export class DateConditionBuilder {
  //Key is date. Value is array DateHistogramCondition having with date <br>
  //Example: Day => [currentDay, lastNDays, ...]
  private datePreferenceAsMap: Map<DateTypes, DateHistogramConditionTypes[]> = new Map<DateTypes, DateHistogramConditionTypes[]>();
  //Key is condition. Value is array DateHistogramCondition having
  //Example:
  //Last => [lastNMinutes, lastNHours, lastNDays, ...]
  private conditionPreferenceAsMap: Map<DateConditionTypes, DateHistogramConditionTypes[]> = new Map<DateConditionTypes, DateHistogramConditionTypes[]>();

  private partOfDateHistogramConditionAsMap: Map<DateHistogramConditionTypes, [DateConditionTypes, DateTypes | undefined]> = new Map<
    DateHistogramConditionTypes,
    [DateConditionTypes, DateTypes | undefined]
  >();

  add(condition: DateConditionTypes, date: DateTypes | undefined, result: DateHistogramConditionTypes): DateConditionBuilder {
    this.addCondition(condition, result);
    this.addDate(date, result);
    this.addPartOfCondition(condition, date, result);
    return this;
  }

  build(): DateHistogramConditionCreator {
    return new DateHistogramConditionCreator(this.datePreferenceAsMap, this.conditionPreferenceAsMap, this.partOfDateHistogramConditionAsMap);
  }

  private addCondition(condition: DateConditionTypes, result: DateHistogramConditionTypes): void {
    const partOfConditions: string[] | undefined = this.conditionPreferenceAsMap.get(condition);
    if (partOfConditions) {
      partOfConditions.push(result);
    } else {
      this.conditionPreferenceAsMap.set(condition, [result]);
    }
  }

  private addDate(date: DateTypes | undefined, result: DateHistogramConditionTypes): void {
    if (date) {
      const partOfDateAsMap: string[] | undefined = this.datePreferenceAsMap.get(date);
      if (partOfDateAsMap) {
        partOfDateAsMap.push(result);
      } else {
        this.datePreferenceAsMap.set(date, [result]);
      }
    }
  }

  private addPartOfCondition(condition: DateConditionTypes, date: DateTypes | undefined, result: DateHistogramConditionTypes) {
    const partOfCondition: [DateConditionTypes, DateTypes | undefined] | undefined = this.partOfDateHistogramConditionAsMap.get(result);
    if (partOfCondition) {
      partOfCondition[0] = condition;
      partOfCondition[1] = date;
    } else {
      this.partOfDateHistogramConditionAsMap.set(result, [condition, date]);
    }
  }
}
