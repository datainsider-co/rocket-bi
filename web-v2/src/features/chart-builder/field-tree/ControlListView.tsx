import type { ChartControl } from '@/core/chart-builder/chartControls';
import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { FieldLabelView } from './FieldLabelView';
import { FieldTreeEmptyView } from './FieldTreeEmptyView';
import { controlLookOf, type FieldTreePayload } from './fieldTree.utils';

/** The dashboard's chart controls, dragged into a zone or the filters (v1 Chart Control tab). */
export function ControlListView({ controls, searching = false }: { controls: readonly ChartControl[]; searching?: boolean }) {
  if (controls.length === 0) return <FieldTreeEmptyView listing="control" searching={searching} />;
  return (
    <ul className="field-tree__list" aria-label="Chart controls">
      {controls.map(control => {
        const payload: FieldTreePayload = { kind: 'control', control };
        return (
          <li key={control.id}>
            <FieldDraggable id={`control:${control.id}`} payload={payload}>
              <FieldLabelView look={controlLookOf(control)} />
            </FieldDraggable>
          </li>
        );
      })}
    </ul>
  );
}
