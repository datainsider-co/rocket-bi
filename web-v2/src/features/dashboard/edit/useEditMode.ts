import { useCallback, useMemo, useState } from 'react';
import type { Dashboard } from '@/core/dashboard/Dashboard';
import type { Position, WidgetId } from '@/core/dashboard/Position';
import { editedPositions, layoutToSave } from './dashboardEdit.utils';
import type { DashboardEditor } from './useDashboardEditor';

/**
 * Edit mode (v1 `DashboardMode.Edit`): the layout changes stay here until Save, which sends every position and goes
 * back to view, as v1 did when leaving edit mode. Widget changes are saved as they happen (`useDashboardEditor`).
 */
export function useEditMode(dashboard: Dashboard | undefined, editor: DashboardEditor | undefined) {
  const [editing, setEditing] = useState(false);
  const [moves, setMoves] = useState<Readonly<Record<WidgetId, Position>>>({});
  const [saving, setSaving] = useState(false);

  const shown = useMemo(
    () => (dashboard && editing ? { ...dashboard, positions: editedPositions(dashboard, moves) } : dashboard),
    [dashboard, editing, moves]
  );
  const move = useCallback((changed: Record<WidgetId, Position>) => setMoves(current => ({ ...current, ...changed })), []);
  /** Puts widgets that left a tab (or came into one) in a free slot of their new grid, saved with the layout. */
  const release = useCallback(
    (ids: readonly WidgetId[]) => {
      const changed = ids.flatMap(id => {
        const position = dashboard?.positions[id];
        return position ? [[id, { ...position, row: -1, column: -1 }] as const] : [];
      });
      if (changed.length > 0) move(Object.fromEntries(changed));
    },
    [dashboard, move]
  );

  const start = useCallback(() => {
    setMoves({});
    setEditing(true);
  }, []);

  const layout = useMemo(() => dashboard && layoutToSave(dashboard, moves), [dashboard, moves]);

  /** Saves the layout and leaves edit mode; stays in it when saving fails. */
  const save = useCallback(async () => {
    if (!layout || !editor) return;
    setSaving(true);
    try {
      await editor.savePositions(layout);
      setMoves({});
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }, [layout, editor]);

  return { editing, shown, moves, move, release, start, save, saving, dirty: Object.keys(moves).length > 0 };
}
