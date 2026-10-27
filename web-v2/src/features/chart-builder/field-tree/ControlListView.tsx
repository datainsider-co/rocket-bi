import type { ChartControl } from '@/core/chart-builder/chartControls';
import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { controlIconOf, type FieldTreePayload } from './fieldTree.utils';

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
              <div className="flex cursor-grab items-center gap-2 rounded px-2 py-1.5 hover:bg-black/5" title={control.title}>
                <img src={controlIconOf(control)} alt="" className="h-4 w-4 shrink-0" />
                <span className="truncate">{control.title}</span>
              </div>
            </FieldDraggable>
          </li>
        );
      })}
    </ul>
  );
}
