import { createContext, use, useCallback, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { Widget } from '@/core/dashboard/Widget';
import { filterRequestOf, type InternalFilter } from '@/core/query/internalFilter';
import type { FilterRequestJson } from '@/core/query/QueryRequest';
import {
  controlEntryOf,
  controlsReducer,
  hasChangedControls,
  initialControls,
  initialMainDate,
  mainDateValues,
  panelOfWidgets,
  toStoredMainDate,
  type ControlEntry,
  type ControlEntryMap,
  type MainDateState
} from './controls.utils';
import { localMainDateStorage, type MainDateStorage } from './mainDateStorage';

interface DashboardControlsState {
  /** Applied values of every control that has some; what charts query with. */
  controls: ControlEntryMap;
  /** Every widget of the dashboard by id, for the controls a chart depends on. */
  widgets: ReadonlyMap<number, Widget>;
  /** The values a control shows: its unapplied change in a filter panel first. */
  entryOf: (id: number) => ControlEntry | undefined;
  /** Sets a control; inside a filter panel the change waits for the panel's Apply. */
  setControl: (id: number, values: ControlEntry) => void;
  applyPanel: (panelId: number) => void;
  /** Present when the dashboard has a main date filter. */
  mainDate?: MainDateState;
  setMainDate: (mainDate: MainDateState) => void;
  /** Takes the main date filter off the page and forgets the viewer's choice (v1 `FilterStore.removeMainDateData`). */
  removeMainDate: () => void;
  /** Dashboard-wide filters, those drill through opened the dashboard with first. */
  headerFilters: readonly InternalFilter[];
  /** The requests of the header filters that are on and complete; every chart affected by filters sends them. */
  headerRequests: readonly FilterRequestJson[];
  setHeaderFilter: (filter: InternalFilter) => void;
  removeHeaderFilter: (id: number) => void;
  /** Back to every control's default, the main date excepted, and to the header filters the dashboard opened with. */
  reset: () => void;
  changed: boolean;
}

const DashboardControlsContext = createContext<DashboardControlsState | null>(null);

const currentDate = () => new Date();

const NO_FILTERS: readonly InternalFilter[] = [];

interface DashboardControlsProviderProps {
  dashboard: Dashboard;
  /** The header filters to start with (`?filters=`). */
  headerFilters?: readonly InternalFilter[];
  storage?: MainDateStorage;
  now?: () => Date;
  children: ReactNode;
}

/**
 * Filter, cross filter, tab control and main date values of one dashboard (v1 `QuerySettingStore`,
 * `FilterStore.groupFilterMap`, `DashboardControllerStore.dynamicFunctionMap`). Mount it with a `key` per dashboard so
 * a different dashboard starts from its own defaults.
 */
export function DashboardControlsProvider({
  dashboard,
  headerFilters = NO_FILTERS,
  storage = localMainDateStorage,
  now = currentDate,
  children
}: DashboardControlsProviderProps) {
  const [start] = useState(() => {
    const mainDate = initialMainDate(dashboard.setting.mainDateFilter, storage.load(dashboard.id));
    return { mainDate, initial: initialControls(dashboard.widgets, mainDate, now()), headerFilters };
  });
  const [state, dispatch] = useReducer(controlsReducer, {
    controls: start.initial,
    pending: {},
    mainDate: start.mainDate,
    headerFilters: start.headerFilters
  });
  const widgets = useMemo(() => new Map<number, Widget>(dashboard.widgets.map(widget => [widget.id, widget])), [dashboard.widgets]);
  const panels = useMemo(() => panelOfWidgets(dashboard.widgets), [dashboard.widgets]);

  const setControl = useCallback(
    (id: number, values: ControlEntry) => dispatch({ type: 'set', id, values, panelId: panels.get(id) }),
    [panels]
  );
  const applyPanel = useCallback((panelId: number) => dispatch({ type: 'apply', panelId }), []);
  const setMainDate = useCallback(
    (mainDate: MainDateState) => {
      storage.save(dashboard.id, toStoredMainDate(mainDate));
      dispatch({ type: 'mainDate', mainDate, values: mainDateValues(mainDate, now()) });
    },
    [storage, dashboard.id, now]
  );
  const removeMainDate = useCallback(() => {
    storage.remove(dashboard.id);
    dispatch({ type: 'removeMainDate' });
  }, [storage, dashboard.id]);
  const setHeaderFilter = useCallback((filter: InternalFilter) => dispatch({ type: 'headerFilter', filter }), []);
  const removeHeaderFilter = useCallback((id: number) => dispatch({ type: 'removeHeaderFilter', id }), []);
  const reset = useCallback(() => dispatch({ type: 'reset', initial: start.initial, headerFilters: start.headerFilters }), [start]);
  const headerRequests = useMemo(() => state.headerFilters.flatMap(filter => filterRequestOf(filter) ?? []), [state.headerFilters]);

  const value = useMemo(
    () => ({
      controls: state.controls,
      widgets,
      entryOf: (id: number) => controlEntryOf(state, id, panels.get(id)),
      setControl,
      applyPanel,
      mainDate: state.mainDate,
      setMainDate,
      removeMainDate,
      headerFilters: state.headerFilters,
      headerRequests,
      setHeaderFilter,
      removeHeaderFilter,
      reset,
      changed: hasChangedControls(state, start.initial, start.headerFilters)
    }),
    [state, widgets, panels, setControl, applyPanel, setMainDate, removeMainDate, headerRequests, setHeaderFilter, removeHeaderFilter, reset, start]
  );
  return <DashboardControlsContext value={value}>{children}</DashboardControlsContext>;
}

export function useDashboardControls(): DashboardControlsState {
  const state = use(DashboardControlsContext);
  if (!state) {
    throw new Error('useDashboardControls must be used inside <DashboardControlsProvider>');
  }
  return state;
}
