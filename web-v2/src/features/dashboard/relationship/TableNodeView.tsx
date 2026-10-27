import { memo } from 'react';
import { Dropdown } from 'antd';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { ColumnTypeIcon } from '@/shared/schema/ColumnTypeIcon';
import { TABLE_DRAG_HANDLE_CLASS, type TableNode } from './relationshipGraph.utils';

const NO_NAME = '<<noname>>';

/**
 * A table on the relationship canvas (v1 `TableSchemaItem`): the database name, the table header that moves it,
 * and one row per shown column. Each row is a handle, so dragging a row onto another table's row joins them.
 * Showing or hiding rows changes the node's height, which makes React Flow measure the handles again.
 */
function TableNodeViewImpl({ id, data, isConnectable }: NodeProps<TableNode>) {
  const { table, columns, related, expanded, onToggleExpand } = data;

  return (
    <div className="relationship-table">
      <div className={`relationship-table__db ${TABLE_DRAG_HANDLE_CLASS}`} title={table.dbName}>
        {table.dbName || NO_NAME}
      </div>
      <div className="relationship-table__card">
        <div className={`relationship-table__header ${TABLE_DRAG_HANDLE_CLASS}`}>
          <span className="truncate" title={table.tblName}>
            {table.tblName || NO_NAME}
          </span>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [{ key: 'toggle', label: expanded ? 'Collapse' : 'Expand' }],
              onClick: () => onToggleExpand(id)
            }}
          >
            <button type="button" className="relationship-table__menu nodrag" aria-label={`Actions of ${table.tblName}`}>
              <i className="di-icon-three-dot" />
            </button>
          </Dropdown>
        </div>
        {columns.map(column => (
          <div
            key={column.name}
            className={`relationship-table__row${related.has(column.name) ? ' relationship-table__row--related' : ''}`}
          >
            <ColumnTypeIcon type={column.type} color="var(--relationship-accent)" />
            <span className="truncate" title={column.name}>
              {column.name}
            </span>
            <Handle
              id={column.name}
              type="source"
              position={Position.Left}
              isConnectable={isConnectable}
              className="relationship-table__handle"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export const TableNodeView = memo(TableNodeViewImpl);
