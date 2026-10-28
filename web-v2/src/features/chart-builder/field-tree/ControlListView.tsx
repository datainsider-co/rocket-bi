import type { ChartControl } from '@/core/chart-builder/chartControls';
import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { FieldLabelView } from './FieldLabelView';
import { controlLookOf, type FieldTreePayload } from './fieldTree.utils';

/** The dashboard's chart controls, dragged into a zone or the filters (v1 Chart Control tab). */
export function ControlListView({ controls }: { controls: readonly ChartControl[] }) {
  if (controls.length === 0) return <p className="m-2 text-black/45">No chart controls available</p>;
  return (
    <ul className="m-0 list-none p-0" aria-label="Chart controls">
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
