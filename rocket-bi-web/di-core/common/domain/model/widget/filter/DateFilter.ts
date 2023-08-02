/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:48 AM
 */

import { Position, WidgetCommonData, Widgets } from '@core/common/domain/model';
import { FilterRequest } from '@core/common/domain/request';
import { FilterWidget } from './FilterWidget';

/**
 * @deprecated from v1.0.0
 */
export class DateFilter extends FilterWidget {
  className = Widgets.DateFilter;
  private date = '';

  constructor(commonSetting: WidgetCommonData) {
    super(commonSetting);
  }

  static fromObject(obj: DateFilter): DateFilter {
    return new DateFilter(obj);
  }

  static empty() {
    return new DateFilter({ id: -1, name: '', description: '' });
  }

  setDate(date: string) {
    this.date = date;
  }

  getDate(): string {
    return this.date;
  }

  toFilterRequest(): FilterRequest | undefined {
    return undefined;
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 8, 3, 1);
  }
}
