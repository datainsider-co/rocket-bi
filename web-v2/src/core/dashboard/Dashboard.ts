import { asArray, asNumber, asRecord, asString, isRecord, type JsonObject } from '@/core/json/json';
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
  /** `setting` as stored: saving merges onto it, so keys v2 doesn't model survive. */
  readonly settingJson: JsonObject;
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
    // A dashboard created without a setting has none; v1 then used the default, which has the main date filter.
    setting: isRecord(json['setting']) ? new DashboardSetting(json['setting']) : DashboardSetting.default(),
    // Kept as stored (`{}` for none), so reading the dashboard never writes defaults back.
    settingJson: asRecord(json['setting']),
    widgets: asArray(json['widgets']).map(widgetFromJson),
    positions: positionsFromJson(json['widget_positions'])
  };
}
