import { useCallback, useMemo } from 'react';
import { vizOptionsOf, type VizChanges } from '@/core/chart-builder/vizChanges';
import { useBuilder } from '../state/BuilderContext';

/** The builder's viz options for the Settings tab, and edits sent to its reducer. */
export function useChartSettings() {
  const { state, setting, dispatch } = useBuilder();
  const viz = useMemo(() => vizOptionsOf(state.options), [state.options]);
  const onChange = useCallback((changes: VizChanges) => dispatch({ type: 'vizChanges', changes }), [dispatch]);
  return { chartType: state.data.chartType, setting, viz, onChange };
}
