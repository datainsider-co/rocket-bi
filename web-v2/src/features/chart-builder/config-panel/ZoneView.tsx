import { SORTING_ZONE, type ZoneConfig } from '@/core/chart-builder/chartCatalogue';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import type { JsonObject } from '@/core/json/json';
import { FieldDropZone } from '@/shared/field-dnd/FieldDropZone';
import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import { DropHintView } from './DropHintView';
import { isMeasureItem } from './zoneItem.utils';
import { ZoneItemView } from './ZoneItemView';
import { ZoneTitleView } from './ZoneTitleView';

interface ZoneViewProps {
  zone: ZoneConfig;
  items: readonly FunctionData[];
  /** Picking fields by click: the tables, adding one at the end, swapping an item's; editing a measure. */
  fields: { tables: readonly TableNode[]; onAdd: (field: DroppedField) => void; onSwap: (id: number, field: DroppedField) => void; onEditMeasure?: (field: JsonObject) => void };
  onChange: (item: FunctionData) => void;
  onConfig: (item: FunctionData) => void;
  onRemove: (id: number) => void;
}

/** One zone of the chart type, or Sorting (v1 `ConfigDraggable`): its items, and a hint while it takes more. */
export function ZoneView({ zone, items, fields, onChange, onConfig, onRemove }: ZoneViewProps) {
  const full = zone.maxItems !== undefined && items.length >= zone.maxItems;
  return (
    <section className="flex flex-col gap-1" aria-label={zone.title}>
      <ZoneTitleView title={zone.title} optional={zone.optional} />
      <FieldDropZone
        zoneId={zone.key}
        itemKeys={items.map(item => String(item.id))}
        placeholder={full ? null : <DropHintView tables={fields.tables} onPick={fields.onAdd} />}
        renderItem={index => {
          const item = items[index];
          return (
            item && (
              <ZoneItemView
                item={item}
                sorting={zone.key === SORTING_ZONE.key}
                tables={fields.tables}
                onChange={onChange}
                onPickField={field => fields.onSwap(item.id, field)}
                menu={{
                  onConfig: () => onConfig(item),
                  onRemove: () => onRemove(item.id),
                  onEditMeasure: fields.onEditMeasure && isMeasureItem(item) ? () => fields.onEditMeasure?.(item.field) : undefined
                }}
              />
            )
          );
        }}
      />
    </section>
  );
}
