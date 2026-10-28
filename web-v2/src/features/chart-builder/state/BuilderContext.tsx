import { createContext, use, useMemo, type ActionDispatch, type ReactNode } from 'react';
import type { ChartControl } from '@/core/chart-builder/chartControls';
import type { JsonObject } from '@/core/json/json';
import type { BuilderAction, BuilderState } from './builderState.utils';
import { useBuilderState, type BuilderStart } from './useBuilderState';

export interface BuilderEnv {
  /** The dashboard's chart controls, for zones and filter conditions; none in builders without a dashboard. */
  readonly controls: readonly ChartControl[];
  /** An ad hoc view's SQL, for charts on SQL views. Keep it stable. */
  readonly sqlQueryOf?: (viewName: string) => string | undefined;
  /** Queries the panels make (a column's values) run as the dashboard's, like the chart. */
  readonly dashboardId?: number;
}

export interface BuilderContextValue extends BuilderEnv {
  readonly state: BuilderState;
  /** The chart's setting (`builderSettingOf`), `undefined` while the zones are not filled. */
  readonly setting: JsonObject | undefined;
  /** Whether the user changed anything since the builder opened. */
  readonly dirty: boolean;
  readonly dispatch: ActionDispatch<[BuilderAction]>;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

interface BuilderProviderProps extends BuilderEnv {
  readonly start: BuilderStart;
  readonly children: ReactNode;
}

/** The builder's state, shared by its panels (field tree drops, config panel, preview, settings). */
export function BuilderProvider({ start, controls, sqlQueryOf, dashboardId, children }: BuilderProviderProps) {
  const { state, setting, dirty, dispatch } = useBuilderState(start, sqlQueryOf);
  const value = useMemo<BuilderContextValue>(
    () => ({ state, setting, dirty, dispatch, controls, sqlQueryOf, dashboardId }),
    [state, setting, dirty, dispatch, controls, sqlQueryOf, dashboardId]
  );
  return <BuilderContext value={value}>{children}</BuilderContext>;
}

export function useBuilder(): BuilderContextValue {
  const value = use(BuilderContext);
  if (!value) throw new Error('useBuilder must be used inside <BuilderProvider>');
  return value;
}
