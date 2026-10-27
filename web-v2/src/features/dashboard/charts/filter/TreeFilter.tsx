import { useTreeFilter, type TreeFilterInput } from './useTreeFilter';
import { TreeFilterView, type TreeFilterLook } from './TreeFilterView';

interface TreeFilterProps extends TreeFilterInput {
  title?: string;
  look: TreeFilterLook;
  singleChoice: boolean;
}

export function TreeFilter({ title, look, singleChoice, ...input }: TreeFilterProps) {
  const tree = useTreeFilter(input);
  return <TreeFilterView title={title} look={look} tree={tree} singleChoice={singleChoice} />;
}
