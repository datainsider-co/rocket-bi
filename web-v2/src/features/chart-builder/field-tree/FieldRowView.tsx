import { FunctionOutlined } from '@ant-design/icons';
import { FieldDraggable } from '@/shared/field-dnd/FieldDraggable';
import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import type { FieldNode, FieldTreePayload } from './fieldTree.utils';

/** A column of the tree, dragged into the zones. Measures show a function icon (v1 `FunctionIcon`). */
export function FieldRowView({ node }: { node: FieldNode }) {
  const payload: FieldTreePayload = { kind: 'column', field: node.dropped };
  return (
    <FieldDraggable id={`field:${node.key}`} payload={payload}>
      <div className="flex cursor-grab items-center gap-2 rounded px-2 py-1.5 hover:bg-black/5" title={node.title}>
        {node.role === 'measure' ? <FunctionOutlined className="shrink-0 text-[var(--color-brand)]" aria-hidden /> : <ColumnTypeIcon type={node.type} />}
        <span className={`truncate ${node.role === 'column' ? '' : 'italic'}`}>{node.title}</span>
      </div>
    </FieldDraggable>
  );
}
