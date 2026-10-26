import { createContext, use, useCallback, useMemo, useReducer, type ReactNode } from 'react';
import type { Widget } from '@/core/dashboard/Widget';
import type { ControlValueMap, ControlValues } from '@/core/query/controlValues';
import { controlsReducer, hasChangedControls, initialControls } from './controls.utils';

interface DashboardControlsState {
  /** Current values of every control that has one. */
  controls: ControlValueMap;
  setControl: (id: number, values: ControlValues) => void;
  /** Back to every control's default. */
  reset: () => void;
  changed: boolean;
}

const DashboardControlsContext = createContext<DashboardControlsState | null>(null);

interface DashboardControlsProviderProps {
  widgets: readonly Widget[];
  children: ReactNode;
}

/**
 * Filter and cross-filter selections of one dashboard (v1 `QuerySettingStore.allDynamicValuesMap` and friends). Mount
 * it with a `key` per dashboard so a different dashboard starts from its own defaults.
 */
export function DashboardControlsProvider({ widgets, children }: DashboardControlsProviderProps) {
  const initial = useMemo(() => initialControls(widgets), [widgets]);
  const [controls, dispatch] = useReducer(controlsReducer, initial);
  const setControl = useCallback((id: number, values: ControlValues) => dispatch({ type: 'set', id, values }), []);
  const reset = useCallback(() => dispatch({ type: 'reset', initial }), [initial]);
  const value = useMemo(
    () => ({ controls, setControl, reset, changed: hasChangedControls(controls, initial) }),
    [controls, setControl, reset, initial]
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
