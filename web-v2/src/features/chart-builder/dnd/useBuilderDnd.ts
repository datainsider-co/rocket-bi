import { useCallback, useMemo } from 'react';
import type { DragSource, DropAction } from '@/shared/field-dnd/fieldDnd.utils';
import { useBuilder } from '../state/BuilderContext';
import { builderActionOf, builderTransferMode, builderZoneRules, dragLabelOf } from './builderDnd.utils';

/** The builder's drop rules and what a drop does to its state, for `FieldDndProvider`. */
export function useBuilderDnd() {
  const { state, dispatch } = useBuilder();
  const { data } = state;
  const zones = useMemo(() => builderZoneRules(data), [data]);
  const onDrop = useCallback(
    (action: DropAction, source: DragSource) => {
      const builderAction = builderActionOf(action, source, data);
      if (builderAction) dispatch(builderAction);
    },
    [data, dispatch]
  );
  const labelOf = useCallback((source: DragSource) => dragLabelOf(source, data), [data]);
  return { zones, transferModeOf: builderTransferMode, onDrop, labelOf };
}
