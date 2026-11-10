import { useTreeFilter, type TreeFilterInput } from './useTreeFilter';
import { TreeFilterView, type TreeFilterLook } from './TreeFilterView';

interface TreeFilterProps extends TreeFilterInput {
  title?: string;
  subtitle?: string;
  look: TreeFilterLook;
  singleChoice: boolean;
}

export function TreeFilter({ title, subtitle, look, singleChoice, ...input }: TreeFilterProps) {
  const tree = useTreeFilter(input);
  return <TreeFilterView title={title} subtitle={subtitle} look={look} tree={tree} singleChoice={singleChoice} />;
}
