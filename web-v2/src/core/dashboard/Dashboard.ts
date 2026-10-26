import { asArray, asNumber, asRecord, asString, isRecord } from '@/core/json/json';
import { DashboardSetting } from './DashboardSetting';
import { positionsFromJson, type Position, type WidgetId } from './Position';
import { widgetFromJson, type Widget } from './Widget';

/**
 * `GET dashboards/{id}`. A plain value so mutations can update it in the query cache. Not modelled: `boost_info`
 * (boost is hidden in v1), the deprecated top-level `main_date_filter` (v1 moved it into `setting`), `use_as_template`
 * and `all_query_views`.
 */
export interface Dashboard {
  readonly id: number;
  readonly name: string;
  readonly ownerId: string;
  readonly setting: DashboardSetting;
  readonly widgets: readonly Widget[];
  /** Every widget's position, tab and filter panel children included, each in its own grid. */
  readonly positions: Readonly<Record<WidgetId, Position>>;
}

export function dashboardFromJson(value: unknown): Dashboard {
  const json = asRecord(value);
  return {
    id: asNumber(json['id']),
    name: asString(json['name']),
    ownerId: asString(json['owner_id']),
    // A dashboard created without a setting has none; v1 then used the default.
    setting: new DashboardSetting(isRecord(json['setting']) ? json['setting'] : undefined),
    widgets: asArray(json['widgets']).map(widgetFromJson),
    positions: positionsFromJson(json['widget_positions'])
  };
}
