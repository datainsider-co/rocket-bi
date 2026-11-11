import { Modal } from 'antd';
import type { PickerItem } from '@/core/chart-builder/chartCatalogue';
import { ChartTypeCardsView } from './ChartTypeCardsView';
import { buildableTypes } from './chartTypes.utils';
import './ChartTypes.css';

interface ChartTypePickerModalProps {
  items: readonly PickerItem[];
  onPick: (chartType: string) => void;
  onCancel: () => void;
}

/**
 * Picks the type of a new chart (v1 `VisualizeSelectionModal`): no header and no close button, the title and its line
 * centered over the cards of the types that can be built. Escape or a click outside cancels.
 */
export function ChartTypePickerModal({ items, onPick, onCancel }: ChartTypePickerModalProps) {
  return (
    <Modal open centered className="chart-type-picker" width={800} footer={null} closable={false} getContainer={false} onCancel={onCancel} aria-labelledby="chart-type-picker-title">
      <h4 id="chart-type-picker-title" className="chart-type-picker__title">
        Select A Visualization
      </h4>
      <p className="chart-type-picker__subtitle">Select a visualization to start. Don&apos;t worry, you could change it later</p>
      <ChartTypeCardsView items={buildableTypes(items)} onPick={onPick} />
    </Modal>
  );
}
