import { useState } from 'react';
import type { NestedNode } from './fieldTree.utils';
import { FieldRowView } from './FieldRowView';

/** A nested column, closed at first like in v1, its columns indented below it. */
export function NestedFieldsView({ node }: { node: NestedNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="field-tree__nested" aria-expanded={open} onClick={() => setOpen(!open)}>
        <i className={`field-tree__caret fa ${open ? 'fa-caret-down' : 'fa-caret-right'}`} aria-hidden />
        <span className="field-tree__name">{node.title}</span>
      </button>
      {open && (
        <div className="field-tree__children">
          {node.fields.map(field => (
            <FieldRowView key={field.key} node={field} />
          ))}
        </div>
      )}
    </div>
  );
}
