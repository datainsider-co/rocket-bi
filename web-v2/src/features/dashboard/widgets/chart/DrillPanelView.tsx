import { useMemo, useState } from 'react';
import { HomeOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import { ErrorState } from '@/shared/status/ErrorState';
import { Loading } from '@/shared/status/Loading';
import { FilterSearchInput } from '../../charts/filter/FilterSearchInput';
import type { DrillChoices } from './chartMenus.utils';
import { DRILL_DATE_LEVELS, type DrillField } from './chartView.utils';
import { DEFAULT_DRILL_DATE_LEVEL, drillPanelTitle, groupDrillFields } from './drillPanel.utils';
import '../../charts/filter/FilterWidget.css';
import './DrillPanel.css';

export interface DrillPanelViewProps {
  /** The dimension the chart is on now. */
  header: string;
  /** The values drilled through so far. */
  path: readonly { value: string }[];
  /** The value to drill into; until one is picked, the panel lists `values`. */
  value?: string;
  values: readonly string[];
  fields: DrillChoices;
  /** Back to the chart before any drill down. */
  onReset: () => void;
  /** Back to the chart as it was before step `index`. */
  onBack: (index: number) => void;
  onPickValue: (value: string) => void;
  onDrill: (field: DrillField, dateLevel?: string) => void;
}

/** A date field's arrow: the date functions to drill by (v1 `.drilldown-scala-function`). */
function DateLevels({ field, onDrill }: { field: DrillField; onDrill: DrillPanelViewProps['onDrill'] }) {
  const [open, setOpen] = useState(false);
  const levels = (
    <div className="drill-panel__levels">
      {DRILL_DATE_LEVELS.map(({ level, label }) => (
        <button key={level} type="button" className="drill-panel__row" onClick={() => onDrill(field, level)}>
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <Popover trigger="click" placement="rightTop" open={open} onOpenChange={setOpen} content={levels} classNames={{ root: 'drill-panel-levels' }}>
      <button type="button" className="drill-panel__more" aria-label={`Date functions of ${field.label}`}>
        <img src="/icons/ic-16-arrow-right.svg" alt="" />
      </button>
    </Popover>
  );
}

/**
 * v1 `DrilldownSetting`: where the drill down is (home, each value, the current dimension), then the value to drill
 * into and the field to drill by. A date field drills by year, or by a function from its arrow.
 */
export function DrillPanelView({ header, path, value, values, fields, onReset, onBack, onPickValue, onDrill }: DrillPanelViewProps) {
  const [keyword, setKeyword] = useState('');
  const groups = useMemo(() => groupDrillFields(fields.fields, keyword), [fields.fields, keyword]);

  return (
    <div className="drill-panel">
      <div className="drill-panel__header">
        <button type="button" className="drill-panel__crumb" aria-label="Reset drill down" title="Reset drill down" onClick={onReset}>
          <HomeOutlined aria-hidden />
        </button>
        {path.map((step, index) => (
          <button key={index} type="button" className="drill-panel__crumb" onClick={() => onBack(index)}>
            {step.value} /
          </button>
        ))}
        <span className="drill-panel__crumb">
          {header}
          {value !== undefined && ` (${value})`} /
        </span>
      </div>
      <div className="drill-panel__divider" />
      <div className="drill-panel__title">{drillPanelTitle(header, value)}</div>
      {value === undefined ? (
        values.length === 0 ? (
          <div className="drill-panel__none">No records for drilldown</div>
        ) : (
          <div className="drill-panel__values">
            {values.map(item => (
              <button key={item} type="button" className="drill-panel__row" title={item} onClick={() => onPickValue(item)}>
                {item}
              </button>
            ))}
          </div>
        )
      ) : fields.loading ? (
        <div className="drill-panel__status">
          <Loading />
        </div>
      ) : fields.fields.length === 0 ? (
        <div className="drill-panel__status">
          <ErrorState message="No field to drill down" />
        </div>
      ) : (
        <>
          <FilterSearchInput value={keyword} placeholder="Search..." onChange={setKeyword} />
          <div className="drill-panel__fields">
            {groups.map(group => (
              <div key={group.title}>
                <div className="drill-panel__group">{group.title}</div>
                {group.fields.map(field => (
                  <div key={field.label} className="drill-panel__field">
                    <button
                      type="button"
                      className="drill-panel__row"
                      title={field.label}
                      onClick={() => onDrill(field, field.isDate ? DEFAULT_DRILL_DATE_LEVEL : undefined)}
                    >
                      {field.label}
                    </button>
                    {field.isDate && <DateLevels field={field} onDrill={onDrill} />}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
