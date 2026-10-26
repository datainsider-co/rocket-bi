import { createContext, use, useCallback, useMemo, useReducer, useState, type ReactNode } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { Widget } from '@/core/dashboard/Widget';
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
  /** Back to every control's default, the main date excepted. */
  reset: () => void;
  changed: boolean;
}

const DashboardControlsContext = createContext<DashboardControlsState | null>(null);

const currentDate = () => new Date();

interface DashboardControlsProviderProps {
  dashboard: Dashboard;
  storage?: MainDateStorage;
  now?: () => Date;
  children: ReactNode;
}

/**
 * Filter, cross filter, tab control and main date values of one dashboard (v1 `QuerySettingStore`,
 * `FilterStore.groupFilterMap`, `DashboardControllerStore.dynamicFunctionMap`). Mount it with a `key` per dashboard so
 * a different dashboard starts from its own defaults.
 */
export function DashboardControlsProvider({ dashboard, storage = localMainDateStorage, now = currentDate, children }: DashboardControlsProviderProps) {
  const [start] = useState(() => {
    const mainDate = initialMainDate(dashboard.setting.mainDateFilter, storage.load(dashboard.id));
    return { mainDate, initial: initialControls(dashboard.widgets, mainDate, now()) };
  });
  const [state, dispatch] = useReducer(controlsReducer, { controls: start.initial, pending: {}, mainDate: start.mainDate });
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
  const reset = useCallback(() => dispatch({ type: 'reset', initial: start.initial }), [start.initial]);

  const value = useMemo(
    () => ({
      controls: state.controls,
      widgets,
      entryOf: (id: number) => controlEntryOf(state, id, panels.get(id)),
      setControl,
      applyPanel,
      mainDate: state.mainDate,
      setMainDate,
      reset,
      changed: hasChangedControls(state, start.initial)
    }),
    [state, widgets, panels, setControl, applyPanel, setMainDate, reset, start.initial]
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
