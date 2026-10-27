import { useState } from 'react';
import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import type { NestedNode } from './fieldTree.utils';
import { FieldRowView } from './FieldRowView';

/** A nested column, closed at first like in v1, its columns indented below it. */
export function NestedFieldsView({ node }: { node: NestedNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="flex w-full cursor-pointer items-center gap-2 rounded border-0 bg-transparent px-2 py-1.5 text-left text-inherit hover:bg-black/5" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? <CaretDownOutlined aria-hidden /> : <CaretRightOutlined aria-hidden />}
        <span className="truncate">{node.title}</span>
      </button>
      {open && (
        <div className="pl-5">
          {node.fields.map(field => (
            <FieldRowView key={field.key} node={field} />
          ))}
        </div>
      )}
    </div>
  );
}
