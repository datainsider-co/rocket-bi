import { useMemo, useReducer, useState } from 'react';
import type { JsonObject } from '@/core/json/json';
import { builderReducer, builderSettingOf, builderStateOf, newBuilderState, type BuilderState } from './builderState.utils';

/** What the builder opens on: a stored chart widget (Config chart), or a chart type just picked (Add chart). */
export type BuilderStart = { readonly widget: JsonObject } | { readonly chartType: string };

function initialState(start: BuilderStart): BuilderState {
  return 'widget' in start ? builderStateOf(start.widget) : newBuilderState(start.chartType);
}

/**
 * The builder's state (v1 `ConfigBuilderStore`) and the chart's setting it gives. `sqlQueryOf` reads an ad hoc view's
 * SQL, for charts on SQL views; keep it stable, it is a dependency of the setting.
 */
export function useBuilderState(start: BuilderStart, sqlQueryOf?: (viewName: string) => string | undefined) {
  const [initial] = useState(() => initialState(start));
  const [state, dispatch] = useReducer(builderReducer, initial);
  const setting = useMemo(() => builderSettingOf(state, sqlQueryOf), [state, sqlQueryOf]);
  // The reducer gives the same state back for what changes nothing, so any other state is an edit.
  return { state, setting, dispatch, dirty: state !== initial };
}
