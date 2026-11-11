import type { PickerItem } from '@/core/chart-builder/chartCatalogue';
import { CHART_ICON_PATH } from '../field-tree/fieldTree.utils';
import './ChartTypes.css';

interface ChartTypeCardsViewProps {
  items: readonly PickerItem[];
  /** The type in use, marked in the list; none for a new chart. */
  value?: string;
  onPick: (chartType: string) => void;
}

/** Chart types as cards (v1 `VisualizationItem`), wrapping and centered. */
export function ChartTypeCardsView({ items, value, onPick }: ChartTypeCardsViewProps) {
  return (
    <ul className="chart-type-cards" aria-label="Chart types">
      {items.map(item => (
        <li key={item.type}>
          <button type="button" className="chart-type-card" aria-pressed={value === undefined ? undefined : item.type === value} onClick={() => onPick(item.type)}>
            <img src={CHART_ICON_PATH + item.icon} alt="" />
            <span className="chart-type-card__title">{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
