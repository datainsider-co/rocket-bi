import { useMemo } from 'react';
import type { ChartWidget } from '@/core/dashboard/Widget';
import { asString, type JsonObject } from '@/core/json/json';
import { ValueControlType } from '@/core/query/controlValues';
import { DateMode } from '@/core/query/dateRanges';
import { isFunctionControl } from '@/core/query/dynamicFunctions';
import type { VisualizationResponse } from '@/core/query/VisualizationResponse';
import type { ChartViz } from '@/core/query/vizOptions';
import type { ChartQuery } from '../../controls/chartQuery.utils';
import type { ControlEntry } from '../../controls/controls.utils';
import { titleText } from '../highchartsBase';
import { ChartVizClass } from '../vizClass';
import { DateRangeModePicker } from './DateRangeModePicker';
import { DropdownFilterView } from './DropdownFilterView';
import {
  TabFilterDisplay,
  dateSelectionOf,
  dateSelectionToControl,
  filterOptions,
  functionOptions,
  isNumberInput,
  selectionOf,
  selectionToControl
} from './filter.utils';
import { InputFilterView } from './InputFilterView';
import { slicerBounds, slicerKind, slicerRangeOf, slicerToControl } from './slicerFilter.utils';
import { SlicerFilterView } from './SlicerFilterView';
import { TabFilterView } from './TabFilterView';
import { TreeFilter } from './TreeFilter';

/** Viz classes rendered as filters, which set a control instead of showing data. */
const FILTER_CLASSES = new Set<string>([
  ChartVizClass.TabFilter,
  ChartVizClass.Dropdown,
  ChartVizClass.Slicer,
  ChartVizClass.DateSelect,
  ChartVizClass.Input,
  ChartVizClass.Tree
]);

export function isFilterViz(viz: ChartViz): boolean {
  return FILTER_CLASSES.has(viz.className);
}

export interface FilterRendererProps {
  widget: ChartWidget;
  viz: ChartViz;
  response: VisualizationResponse;
  /** The widget's own query, for a tree filter's deeper levels. */
  query: ChartQuery;
  dashboardId: number;
  /** What the filter shows: its unapplied change in a filter panel, else its control's values. */
  entry: ControlEntry | undefined;
  onChange: (entry: ControlEntry) => void;
}

const EMPTY = { kind: 'table', headers: [], records: [], total: 0 } as const;

/** One filter widget (v1 `TabFilter`, `DropdownFilter`, `SlicerFilter`, `DateFilter2`, `InputFilter`, `TreeFilter`). */
export function FilterRenderer({ widget, viz, response, query, dashboardId, entry, onChange }: FilterRendererProps) {
  const options = viz.options;
  const title = titleText(options.title);
  const table = response.kind === 'table' ? response : EMPTY;
  const selected = useMemo(() => selectionOf(entry), [entry]);
  const onSelect = (values: string[]) => onChange(selectionToControl(values));
  const { displayAs = TabFilterDisplay.Normal, direction, search } = options as { displayAs?: string; direction?: string; search?: { enabled?: boolean } };

  switch (viz.className) {
    case ChartVizClass.TabFilter: {
      const functionMode = isFunctionControl(widget.setting);
      return (
        <TabFilterView
          title={title}
          options={functionMode ? functionOptions(widget.setting) : filterOptions(table, true)}
          selected={selected}
          mode={functionMode ? 'function' : 'filter'}
          displayAs={displayAs}
          direction={direction === 'column' ? 'column' : 'row'}
          searchEnabled={search?.enabled ?? true}
          onChange={values => onChange(functionMode ? { [ValueControlType.SelectedValue]: values } : selectionToControl(values))}
        />
      );
    }
    case ChartVizClass.Dropdown:
      return <DropdownFilterView title={title} options={filterOptions(table, false)} selected={selected} onChange={onSelect} />;
    case ChartVizClass.Slicer: {
      const kind = slicerKind(widget.setting);
      const bounds = slicerBounds(table, options as JsonObject, kind);
      return (
        <SlicerFilterView
          title={title}
          kind={kind}
          bounds={bounds}
          range={slicerRangeOf(entry, bounds, kind)}
          step={typeof options['step'] === 'number' ? options['step'] : undefined}
          onChange={range => onChange(slicerToControl(range, bounds, kind))}
        />
      );
    }
    case ChartVizClass.DateSelect: {
      const { mode, range } = dateSelectionOf(entry);
      return (
        <div className="flex h-full flex-col justify-center gap-1">
          {title && <div className="truncate font-medium">{title}</div>}
          <DateRangeModePicker mode={mode} range={range} onChange={(next: DateMode, dates) => onChange(dateSelectionToControl(next, dates, new Date()))} />
        </div>
      );
    }
    case ChartVizClass.Input: {
      return (
        <InputFilterView
          title={title}
          value={selected[0] ?? ''}
          placeholder={asString(options['placeHolder']) || 'Typing ...'}
          isNumber={isNumberInput(widget.setting, options['isNumber'])}
          onChange={value => onSelect(value === '' ? [] : [value])}
        />
      );
    }
    case ChartVizClass.Tree:
      return (
        <TreeFilter
          title={title}
          singleChoice={displayAs === TabFilterDisplay.SingleChoice}
          widget={widget}
          dashboardId={dashboardId}
          query={query}
          response={response}
          entry={entry}
          onChange={onChange}
        />
      );
    default:
      return null;
  }
}
