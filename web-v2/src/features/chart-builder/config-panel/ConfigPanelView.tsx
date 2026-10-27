import { useState } from 'react';
import type { BuilderData } from '@/core/chart-builder/BuilderData';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { configZonesOf, filterGroupsOf, hasFilterZone } from '../dnd/builderDnd.utils';
import { FilterZoneView, type FilterZoneViewProps } from './filter/FilterZoneView';
import { ItemConfigModal, type EditedItem } from './ItemConfigModal';
import { ZoneView } from './ZoneView';

export interface ConfigPanelViewProps {
  data: BuilderData;
  onItemChange: (zone: string, item: FunctionData) => void;
  onItemRemove: (zone: string, id: number) => void;
  /** The Filters zone's callbacks; its groups come from `data`. */
  filter: Omit<FilterZoneViewProps, 'groups'>;
}

/**
 * The builder's zones (v1 `ConfigBuilder`): the chart type's own, Sorting, then Filters. Place it inside the builder's
 * `BuilderDndProvider`.
 */
export function ConfigPanelView({ data, onItemChange, onItemRemove, filter }: ConfigPanelViewProps) {
  const [edited, setEdited] = useState<EditedItem>();
  return (
    <div className="flex flex-col gap-4">
      {configZonesOf(data.chartType).map(zone => (
        <ZoneView
          key={`${data.chartType}.${zone.key}`}
          zone={zone}
          items={data.configs[zone.key] ?? []}
          onChange={item => onItemChange(zone.key, item)}
          onConfig={item => setEdited({ zone: zone.key, item })}
          onRemove={id => onItemRemove(zone.key, id)}
        />
      ))}
      {hasFilterZone(data.chartType) && <FilterZoneView groups={filterGroupsOf(data)} {...filter} />}
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
