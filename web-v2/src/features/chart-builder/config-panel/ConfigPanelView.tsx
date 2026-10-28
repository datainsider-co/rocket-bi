import { useState } from 'react';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import type { JsonObject } from '@/core/json/json';
import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import { configZonesOf, filterGroupsOf, hasFilterZone } from '../dnd/builderDnd.utils';
import { FilterZoneView, type FilterZoneViewProps } from './filter/FilterZoneView';
import { ItemConfigModal, type EditedItem } from './ItemConfigModal';
import { ZoneView } from './ZoneView';

export interface ConfigPanelViewProps {
  data: BuilderData;
  onItemChange: (zone: string, item: FunctionData) => void;
  onItemRemove: (zone: string, id: number) => void;
  /** Picking a field by click (v1 "click here", a click on an item's name). */
  fields: {
    tables: readonly TableNode[];
    onAdd: (zone: string, field: DroppedField) => void;
    onSwap: (zone: string, id: number, field: DroppedField) => void;
    /** "Edit Measure" in a measure's menu; none without a schema to edit (an ad hoc chart). */
    onEditMeasure?: (field: JsonObject) => void;
  };
  /** The Filters zone's callbacks; its groups and tables come from `data` and `fields`. */
  filter: Omit<FilterZoneViewProps, 'groups' | 'tables'>;
}

/**
 * The builder's zones (v1 `ConfigBuilder`): the chart type's own, Sorting, then Filters. Place it inside the builder's
 * `BuilderDndProvider`.
 */
export function ConfigPanelView({ data, onItemChange, onItemRemove, fields, filter }: ConfigPanelViewProps) {
  const [edited, setEdited] = useState<EditedItem>();
  return (
    <div className="flex flex-col gap-4">
      {configZonesOf(data.chartType).map(zone => (
        <ZoneView
          key={`${data.chartType}.${zone.key}`}
          zone={zone}
          items={data.configs[zone.key] ?? []}
          fields={{ tables: fields.tables, onAdd: field => fields.onAdd(zone.key, field), onSwap: (id, field) => fields.onSwap(zone.key, id, field), onEditMeasure: fields.onEditMeasure }}
          onChange={item => onItemChange(zone.key, item)}
          onConfig={item => setEdited({ zone: zone.key, item })}
          onRemove={id => onItemRemove(zone.key, id)}
        />
      ))}
      {hasFilterZone(data.chartType) && <FilterZoneView groups={filterGroupsOf(data)} tables={fields.tables} {...filter} />}
      {edited && (
        <ItemConfigModal
          edited={edited}
          onSave={(zone, item) => {
            onItemChange(zone, item);
            setEdited(undefined);
          }}
          onCancel={() => setEdited(undefined)}
        />
      )}
    </div>
  );
}
