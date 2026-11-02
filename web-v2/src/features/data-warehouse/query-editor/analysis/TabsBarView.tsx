import { PlusOutlined } from '@ant-design/icons';
import { Button, Segmented } from 'antd';

export interface TabsBarProps {
  readonly items: readonly { readonly id: number; readonly label: string }[];
  readonly activeId: number;
  readonly onSelect: (id: number) => void;
  /** Add Chart, when the user may. */
  readonly onAddChart?: (() => void) | undefined;
  readonly adding: boolean;
}

/** The query and its charts (v1 `list-viz-item`), and Add Chart. */
export function TabsBarView({ items, activeId, onSelect, onAddChart, adding }: TabsBarProps) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 overflow-x-auto md:w-auto md:flex-1">
      {items.length > 1 && (
        <Segmented<number> size="small" aria-label="Analysis tabs" value={activeId} onChange={onSelect} options={items.map(item => ({ value: item.id, label: item.label }))} />
      )}
      {onAddChart && (
        <Button icon={<PlusOutlined />} loading={adding} onClick={onAddChart}>
          Add Chart
        </Button>
      )}
    </div>
  );
}
