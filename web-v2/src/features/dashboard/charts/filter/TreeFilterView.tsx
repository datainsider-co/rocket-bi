import type { CSSProperties } from 'react';
import { Spin, Tree } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import { FilterTitle } from './FilterTitle';
import type { TreeNode } from './treeFilter.utils';

export interface TreeFilterLook {
  titleStyle: CSSProperties;
  /** From `treeFilterCssVars`. */
  colors: CSSProperties;
}

export interface TreeFilterState {
  nodes: TreeNode[];
  checkedKeys: readonly string[];
  expandedKeys: readonly string[];
  loading: boolean;
  onCheck: (keys: string[]) => void;
  onExpand: (keys: string[]) => void;
}

interface TreeFilterViewProps {
  title?: string;
  look: TreeFilterLook;
  tree: TreeFilterState;
  /** Single choice selects one node; otherwise nodes are checked. */
  singleChoice: boolean;
}

/** v1 `TreeSelection`: checkboxes, or one selected node in single choice; expanding a node loads its children. */
export function TreeFilterView({ title, look, tree, singleChoice }: TreeFilterViewProps) {
  const { nodes, checkedKeys, expandedKeys, loading, onCheck, onExpand } = tree;
  return (
    <div className={`filter-widget filter-widget--padded ${GRID_NO_DRAG_CLASS}`} style={look.colors}>
      <FilterTitle text={title} style={look.titleStyle} className="mb-2" />
      <Spin spinning={loading} className="min-h-0 flex-1">
        <div className="h-full overflow-auto">
          <Tree
            className="filter-tree"
            treeData={nodes}
            checkable={!singleChoice}
            checkedKeys={singleChoice ? undefined : [...checkedKeys]}
            selectedKeys={singleChoice ? [...checkedKeys] : []}
            expandedKeys={[...expandedKeys]}
            onCheck={keys => onCheck((Array.isArray(keys) ? keys : keys.checked).map(String))}
            onSelect={keys => singleChoice && onCheck(keys.map(String))}
            onExpand={keys => onExpand(keys.map(String))}
          />
        </div>
      </Spin>
    </div>
  );
}
