import { useTreeFilter, type TreeFilterInput } from './useTreeFilter';
import { TreeFilterView } from './TreeFilterView';

interface TreeFilterProps extends TreeFilterInput {
  title?: string;
  singleChoice: boolean;
}

export function TreeFilter({ title, singleChoice, ...input }: TreeFilterProps) {
  const tree = useTreeFilter(input);
  return <TreeFilterView title={title} singleChoice={singleChoice} {...tree} />;
}
