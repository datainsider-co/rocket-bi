/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { getFiltersAndSorts, QuerySetting } from '@core/common/domain/model/query/QuerySetting';
import { Condition, Function, InlineSqlView, OrderBy, QuerySettingType, SqlQuery, TableColumn, WidgetId } from '@core/common/domain/model';
import { Paginatable } from '@core/common/domain/model/query/features/Paginatable';
import { IdGenerator } from '@/utils/IdGenerator';
import { RandomUtils } from '@/utils';

export class RawQuerySetting extends QuerySetting implements Paginatable {
  readonly className = QuerySettingType.RawQuery;

  constructor(
    public sql: string,
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(filters, sorts, options, sqlViews, parameters);
  }

  getAllFunction(): Function[] {
    return [];
  }

  getAllTableColumn(): TableColumn[] {
    return [];
  }

  getFrom(): number {
    return 0;
  }

  getSize(): number {
    return 20;
  }

  static fromQuery(query: string) {
    const viewName = IdGenerator.generateKey(['view', RandomUtils.nextString()]);
    return new RawQuerySetting(query, [], [], {}, [new InlineSqlView(viewName, new SqlQuery(query))], {});
  }

  static fromObject(obj: RawQuerySetting) {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));

    return new RawQuerySetting(obj.sql, filters, sorts, obj.options, sqlViews, obj.parameters);
  }

  static isRawQuerySetting(querySetting: QuerySetting): querySetting is RawQuerySetting {
    return querySetting.className === QuerySettingType.RawQuery;
  }

  setDynamicFunctions(functions: Map<WidgetId, TableColumn[]>): void {
    //Nothing to do
  }
}
