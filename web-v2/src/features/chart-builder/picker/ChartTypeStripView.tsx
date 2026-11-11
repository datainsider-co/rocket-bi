import { useState } from 'react';
import { Popover, Tooltip } from 'antd';
import type { PickerItem } from '@/core/chart-builder/chartCatalogue';
import { CHART_ICON_PATH } from '../field-tree/fieldTree.utils';
import { ChartTypeCardsView } from './ChartTypeCardsView';
import { buildableTypes } from './chartTypes.utils';
import './ChartTypes.css';

interface ChartTypeStripViewProps {
  items: readonly PickerItem[];
  value: string;
  onChange: (chartType: string) => void;
}

/** The strip holds more tiles than fit: the current type's tile scrolls into sight when it gets this ref. */
function scrollIntoSight(tile: HTMLButtonElement | null) {
  tile?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
}

/**
 * Switches the chart type while building (v1 `VisualizationItemListing`): a strip of tiles that scrolls sideways, the
 * current one in the accent and in sight, and "View all" with every type as a card. The zones follow
 * (`changeChartType`).
 */
export function ChartTypeStripView({ items, value, onChange }: ChartTypeStripViewProps) {
  const [allOpen, setAllOpen] = useState(false);
  const types = buildableTypes(items);

  const all = (
    <div className="chart-type-all">
      <ChartTypeCardsView
        items={types}
        value={value}
        onPick={type => {
          setAllOpen(false);
          onChange(type);
        }}
      />
    </div>
  );
  return (
    <div className="chart-type-strip">
      <div className="chart-type-strip__header">
        <span className="chart-type-strip__title">Type</span>
        <Popover open={allOpen} onOpenChange={setAllOpen} trigger="click" placement="bottomRight" classNames={{ root: 'chart-type-all-popover' }} content={all}>
          <button type="button" className="chart-type-strip__all" aria-expanded={allOpen}>
            View all
            <img src="/icons/ic-16-arrow-down.svg" alt="" width={16} height={16} />
          </button>
        </Popover>
      </div>
      <ul className="chart-type-strip__list" aria-label="Chart type">
        {types.map(item => (
          <li key={item.type}>
            <Tooltip title={item.title}>
              <button
                ref={item.type === value ? scrollIntoSight : undefined}
                type="button"
                className="chart-type-tile"
                aria-label={item.title}
                aria-pressed={item.type === value}
                onClick={() => onChange(item.type)}
              >
                <img src={CHART_ICON_PATH + item.icon} alt="" />
              </button>
            </Tooltip>
          </li>
        ))}
      </ul>
    </div>
  );
}
