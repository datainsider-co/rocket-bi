import { FieldTreeView } from './FieldTreeView';
import { useFieldTree, type FieldTreeInput } from './useFieldTree';

/** The builder's field tree; place it inside the builder's `FieldDndProvider`. */
export function FieldTree(props: FieldTreeInput) {
  return <FieldTreeView {...useFieldTree(props)} />;
}
