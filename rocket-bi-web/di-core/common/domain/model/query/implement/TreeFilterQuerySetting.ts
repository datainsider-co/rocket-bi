/*
 * @author: tvc12 - Thien Vi
 * @created: 5/29/21, 4:36 PM
 */

import { Filterable, FilterRequest, QuerySettingType, TreeFilterOption, VizSettingType } from '@core/common/domain';
import { QuerySetting } from '../QuerySetting';
import { Condition, getFiltersAndSorts, InlineSqlView, OrderBy, TableColumn, TransformQuery } from '@core/common/domain/model';
import { ListUtils } from '@/utils';
import { cloneDeep } from 'lodash';
import { TabFilterQuerySetting } from './TablFilterQuerySetting';

export class TreeFilterQuerySetting extends TabFilterQuerySetting<TreeFilterOption> implements TransformQuery, Filterable {
  filterRequest?: FilterRequest;

  constructor(
    public values: TableColumn[],
    filters: Condition[] = [],
    sorts: OrderBy[] = [],
    options: Record<string, any> = {},
    filterRequest?: FilterRequest,
    sqlViews: InlineSqlView[] = [],
    parameters: Record<string, string> = {}
  ) {
    super(values, filters, sorts, options, filterRequest, sqlViews, parameters);
  }

  transform(): QuerySetting<TreeFilterOption> {
    const query = cloneDeep(this);
    // use only one row when columns existed
    if (ListUtils.isNotEmpty(query.values)) {
      query.values = query.values.slice(0, 1);
    }
    return query;
  }

  static fromObject(obj: TreeFilterQuerySetting): TreeFilterQuerySetting {
    const [filters, sorts] = getFiltersAndSorts(obj);
    const values = obj.values ? obj.values.map(value => TableColumn.fromObject(value)) : [];
    const sqlViews: InlineSqlView[] = (obj.sqlViews ?? []).map((view: any) => InlineSqlView.fromObject(view));
    const filterRequest: FilterRequest | undefined = obj.filterRequest ? FilterRequest.fromObject(obj.filterRequest) : void 0;
    return new TreeFilterQuerySetting(values, filters, sorts, obj.options, filterRequest, sqlViews, obj.parameters);
  }

  enableFunctionControl(): boolean {
    return false;
  }

  canQuery(): boolean {
    return true;
  }
  isEnableFilter(): boolean {
    return true;
  }

  getDefaultSize(): [number, number] {
    return [12, 8];
  }

  static isTreeFilterQuerySetting(query: QuerySetting | TreeFilterQuerySetting): query is TreeFilterQuerySetting {
    return query.getChartOption()?.className === VizSettingType.TreeFilterSetting;
  }

  getExpandedKeys(): string[] {
    return this.getChartOption()?.options.default?.setting?.value?.expandedKeys ?? [];
  }

  getSelectedKeys(): string[] {
    return this.getChartOption()?.options.default?.setting?.value?.selectedKeys ?? [];
  }
}
