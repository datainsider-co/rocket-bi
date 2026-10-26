import { Spin, Tree } from 'antd';
import { GRID_NO_DRAG_CLASS } from '../../grid/DashboardGridView';
import type { TreeNode } from './treeFilter.utils';

interface TreeFilterViewProps {
  title?: string;
  nodes: TreeNode[];
  checkedKeys: readonly string[];
  expandedKeys: readonly string[];
  /** Single choice selects one node; otherwise nodes are checked. */
  singleChoice: boolean;
  loading: boolean;
  onCheck: (keys: string[]) => void;
  onExpand: (keys: string[]) => void;
}

/** v1 `TreeSelection`: checkboxes, or one selected node in single choice; expanding a node loads its children. */
export function TreeFilterView({ title, nodes, checkedKeys, expandedKeys, singleChoice, loading, onCheck, onExpand }: TreeFilterViewProps) {
  return (
    <div className={`flex h-full flex-col gap-2 overflow-hidden ${GRID_NO_DRAG_CLASS}`}>
      {title && <div className="truncate font-medium">{title}</div>}
      <Spin spinning={loading} className="min-h-0 flex-1">
        <div className="h-full overflow-auto">
          <Tree
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
