import { SORTING_ZONE, type ZoneConfig } from '@/core/chart-builder/chartCatalogue';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { FieldDropZone } from '@/shared/field-dnd/FieldDropZone';
import { DropHintView } from './DropHintView';
import { ZoneItemView } from './ZoneItemView';
import { ZoneTitleView } from './ZoneTitleView';

interface ZoneViewProps {
  zone: ZoneConfig;
  items: readonly FunctionData[];
  onChange: (item: FunctionData) => void;
  onConfig: (item: FunctionData) => void;
  onRemove: (id: number) => void;
}

/** One zone of the chart type, or Sorting (v1 `ConfigDraggable`): its items, and a hint while it takes more. */
export function ZoneView({ zone, items, onChange, onConfig, onRemove }: ZoneViewProps) {
  const full = zone.maxItems !== undefined && items.length >= zone.maxItems;
  return (
    <section className="flex flex-col gap-1" aria-label={zone.title}>
      <ZoneTitleView title={zone.title} optional={zone.optional} />
      <FieldDropZone
        zoneId={zone.key}
        itemKeys={items.map(item => String(item.id))}
        placeholder={full ? null : <DropHintView />}
        renderItem={index => {
          const item = items[index];
          return (
            item && (
              <ZoneItemView
                item={item}
                sorting={zone.key === SORTING_ZONE.key}
                onChange={onChange}
                onConfig={() => onConfig(item)}
                onRemove={() => onRemove(item.id)}
              />
            )
          );
        }}
      />
    </section>
  );
}
