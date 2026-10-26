import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from 'antd';
import { FieldDndProvider } from './FieldDndProvider';
import { FieldDraggable } from './FieldDraggable';
import { FieldDropZone } from './FieldDropZone';
import { applyDrop, type DragSource, type DropAction, type TransferModeOf, type ZoneRules } from './fieldDnd.utils';

interface ConfigItem {
  key: string;
  column: string;
}

const COLUMNS = ['country', 'city', 'order_date', 'price', 'quantity'];

const ZONES = [
  { id: 'columns', title: 'Columns' },
  { id: 'values', title: 'Values' },
  { id: 'legend', title: 'Legend', maxItems: 1 },
  { id: 'sorting', title: 'Sorting' }
] as const;

// As v1: config zones move items between them; the sorting zone only ever copies.
const transferModeOf: TransferModeOf = (from, to) => (from === 'sorting' || to === 'sorting' ? 'copy' : 'move');

// Every item in a zone needs its own key, also when the same column is copied.
const newKey = () => crypto.randomUUID();

/** Wires the pieces the way the chart builder will: lists in state, `applyDrop` with a factory. */
function Playground({ disableValues }: { disableValues: boolean }) {
  const [lists, setLists] = useState<Readonly<Record<string, readonly ConfigItem[]>>>({
    columns: [{ key: 'c1', column: 'country' }],
    values: [],
    legend: [],
    sorting: []
  });

  const zones = useMemo<ZoneRules>(
    () =>
      Object.fromEntries(
        ZONES.map(zone => [
          zone.id,
          { size: lists[zone.id]?.length ?? 0, maxItems: 'maxItems' in zone ? zone.maxItems : undefined, disabled: disableValues && zone.id === 'values' }
        ])
      ),
    [lists, disableValues]
  );

  const onDrop = useCallback((action: DropAction, source: DragSource) => {
    setLists(current =>
      applyDrop(current, action, {
        fromExternal: () => ({ key: newKey(), column: String(source.kind === 'external' ? source.payload : '') }),
        fromZone: item => ({ ...item, key: newKey() })
      })
    );
  }, []);

  const removeItem = (zoneId: string, index: number) =>
    setLists(current => ({ ...current, [zoneId]: (current[zoneId] ?? []).toSpliced(index, 1) }));

  return (
    <FieldDndProvider
      zones={zones}
      transferModeOf={transferModeOf}
      onDrop={onDrop}
      renderOverlay={source => (
        <Tag color="blue" className="cursor-grabbing shadow">
          {source.kind === 'external' ? String(source.payload) : lists[source.zoneId]?.[source.index]?.column}
        </Tag>
      )}
    >
      <div className="flex gap-6">
        <div className="flex w-48 flex-col gap-1">
          <b>Fields</b>
          {COLUMNS.map(column => (
            <FieldDraggable key={column} id={`column:${column}`} payload={column}>
              <div className="cursor-grab rounded px-2 py-1 hover:bg-gray-100">{column}</div>
            </FieldDraggable>
          ))}
        </div>
        <div className="flex w-72 flex-col gap-4">
          {ZONES.map(zone => {
            const items = lists[zone.id] ?? [];
            const rule = zones[zone.id];
            const full = rule?.maxItems !== undefined && items.length >= rule.maxItems;
            return (
              <div key={zone.id} className="flex flex-col gap-2">
                <b>{zone.title}</b>
                <FieldDropZone
                  zoneId={zone.id}
                  itemKeys={items.map(item => item.key)}
                  placeholder={full ? null : <div className="p-2 text-gray-400">Drag a field here</div>}
                  renderItem={index => (
                    <div className="flex items-center justify-between px-2 py-1">
                      <span>{items[index]?.column}</span>
                      <button type="button" className="text-gray-400" onClick={() => removeItem(zone.id, index)}>
                        ✕
                      </button>
                    </div>
                  )}
                />
              </div>
            );
          })}
        </div>
        <pre className="text-xs">{JSON.stringify(lists, null, 2)}</pre>
      </div>
    </FieldDndProvider>
  );
}

const meta = {
  title: 'Shared/FieldDnd',
  component: Playground,
  args: { disableValues: false }
} satisfies Meta<typeof Playground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChartBuilder: Story = {};

export const DisabledZone: Story = { args: { disableValues: true } };
