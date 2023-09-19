/*
 * @author: tvc12 - Thien Vi
 * @created: 12/16/20, 3:33 PM
 */

import { DateRange } from '@/shared';
import { DateTimeUtils } from '@/utils';
import { Field, MainDateMode, ChartOptionClassName } from '@core/common/domain/model';
import { CompareRequest } from '@core/common/domain/request';
import { DIKeys } from '@core/common/modules';
import { CompareBuilder, CompareResolver } from '@core/common/services';
import { ConditionUtils } from '@core/utils';
import { InjectValue } from 'typescript-ioc';

export class MainDateCompareResolver implements CompareResolver {
  private chartType!: ChartOptionClassName;
  private field!: Field;
  private currentRange!: DateRange;
  private compareRange!: DateRange;

  @InjectValue(DIKeys.CompareBuilder)
  private builders!: Map<string, CompareBuilder>;

  withChartType(chartType: ChartOptionClassName): MainDateCompareResolver {
    this.chartType = chartType;
    return this;
  }

  withField(field: Field): MainDateCompareResolver {
    this.field = field;
    return this;
  }

  withCurrentRange(range: DateRange): MainDateCompareResolver {
    this.currentRange = this.formatDateRange(range);
    return this;
  }

  withCompareRange(range: DateRange): MainDateCompareResolver {
    this.compareRange = this.formatDateRange(range);
    return this;
  }

  private formatDateRange(range: DateRange): DateRange {
    return {
      start: DateTimeUtils.formatDate(range.start),
      end: DateTimeUtils.formatDate(range.end, true)
    };
  }

  build(): CompareRequest | undefined {
    const builder = this.builders.get(this.chartType);
    const firstCondition = ConditionUtils.buildDateFilterCondition(this.field, this.currentRange, MainDateMode.custom);
    const secondCondition = ConditionUtils.buildDateFilterCondition(this.field, this.compareRange, MainDateMode.custom);
    if (builder) {
      return builder.buildCompareRequest(firstCondition, secondCondition);
    } else {
      return void 0;
    }
  }
}
