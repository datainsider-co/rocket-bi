import { Modal, Tooltip, Typography } from 'antd';
import type { PickerItem } from '@/core/chart-builder/chartCatalogue';
import { CHART_ICON_PATH } from '../field-tree/fieldTree.utils';

interface ChartTypePickerModalProps {
  items: readonly PickerItem[];
  onPick: (chartType: string) => void;
  onCancel: () => void;
}

/**
 * Picks the type of a new chart (v1 `VisualizeSelectionModal`). Types v2 can't build yet stay in the grid, disabled,
 * so the picker reads like v1's.
 */
export function ChartTypePickerModal({ items, onPick, onCancel }: ChartTypePickerModalProps) {
  return (
    <Modal open centered width={820} footer={null} title="Select A Visualization" onCancel={onCancel}>
      <Typography.Paragraph type="secondary">Select a visualization to start. Don&apos;t worry, you could change it later</Typography.Paragraph>
      <ul className="m-0 grid max-h-[60vh] list-none grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-2 overflow-auto p-0" aria-label="Chart types">
        {items.map(item => {
          const button = (
            <button
              type="button"
              disabled={!item.buildable}
              onClick={() => onPick(item.type)}
              className="flex h-full w-full cursor-pointer flex-col items-center gap-2 rounded-lg border border-solid border-black/10 bg-transparent p-3 text-inherit hover:border-[var(--color-brand)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10"
            >
              <img src={CHART_ICON_PATH + item.icon} alt="" className="h-10 w-10" />
              <span className="text-center text-xs">{item.title}</span>
            </button>
          );
          return <li key={item.type}>{item.buildable ? button : <Tooltip title="Not available yet">{button}</Tooltip>}</li>;
        })}
      </ul>
    </Modal>
  );
}
