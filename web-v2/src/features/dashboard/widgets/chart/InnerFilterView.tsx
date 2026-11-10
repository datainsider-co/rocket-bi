import { useState, type CSSProperties } from 'react';
import { Popover, Select } from 'antd';
import type { FilterOption } from '../../charts/filter/filter.utils';
import './InnerFilter.css';

const SHOW_ALL = '__show_all__';

/** v1 `ChartFilterPopover`'s mark on the chosen row. */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="#597FFF"
        d="M12.293 4.293L6 10.586 3.707 8.293c-.392-.379-1.016-.374-1.402.012-.386.386-.391 1.01-.012 1.402l3 3c.39.39 1.024.39 1.414 0l7-7c.379-.392.374-1.016-.012-1.402-.386-.386-1.01-.391-1.402-.012z"
      />
    </svg>
  );
}

export interface InnerFilterViewProps {
  label: string;
  options: readonly FilterOption[];
  /** Empty means Show All. */
  selected: readonly string[];
  loading: boolean;
  /** Bordered tabs, or a dropdown (the filter's `displayAs`). */
  asTabs: boolean;
  /** The card is too narrow for either: an icon that opens the options instead. */
  compact: boolean;
  /** The filter's tab colors (`tabFilterCssVars`). */
  style?: CSSProperties;
  onChange: (selected: string[]) => void;
}

/**
 * v1 `ChartFilter`: a chart's own filter in its action bar, one value or Show All. Tabs in a strip that scrolls, or a
 * dropdown; on a narrow card, an icon with the same options in a popover.
 */
export function InnerFilterView({ label, options, selected, loading, asTabs, compact, style, onChange }: InnerFilterViewProps) {
  const [open, setOpen] = useState(false);
  const value = selected[0] ?? SHOW_ALL;
  const items = [{ label: 'Show All', value: SHOW_ALL }, ...options];
  const pick = (next: string) => onChange(next === SHOW_ALL ? [] : [next]);
  const tab = (item: FilterOption) => (
    <button key={item.value} type="button" aria-pressed={item.value === value} className="filter-tab-item" title={item.label} onClick={() => pick(item.value)}>
      {item.label}
    </button>
  );

  if (compact) {
    const pickAndClose = (next: string) => {
      pick(next);
      setOpen(false);
    };
    const content = (
      <div className={`inner-filter-options${asTabs ? ' inner-filter-options--tabs' : ''}`} style={style}>
        {items.map(item =>
          asTabs ? (
            <button
              key={item.value}
              type="button"
              aria-pressed={item.value === value}
              className="filter-tab-item"
              title={item.label}
              onClick={() => pickAndClose(item.value)}
            >
              {item.label}
            </button>
          ) : (
            <button key={item.value} type="button" aria-pressed={item.value === value} className="inner-filter-option" onClick={() => pickAndClose(item.value)}>
              <span className="inner-filter-option__label">{item.label}</span>
              {item.value === value && <CheckIcon />}
            </button>
          )
        )}
      </div>
    );
    return (
      <Popover trigger="click" placement="bottomLeft" arrow={false} open={open} onOpenChange={setOpen} content={content} classNames={{ root: 'inner-filter-popover' }}>
        <button type="button" className="inner-filter-button" aria-label={label} title="Filter">
          <img src="/icons/ic-inner-filter.svg" alt="" />
        </button>
      </Popover>
    );
  }
  if (asTabs) {
    return (
      <div className="inner-filter-tabs" style={style}>
        {items.map(tab)}
      </div>
    );
  }
  return (
    <Select
      className="inner-filter-select"
      aria-label={label}
      loading={loading}
      value={value}
      onChange={pick}
      showSearch={{ optionFilterProp: 'label' }}
      popupMatchSelectWidth={false}
      options={items}
    />
  );
}
