import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EtlNode } from '../graph/etlCanvas.utils';
import { NodeMenu } from './NodeMenu';

/**
 * A table (v1 `TableItem`): the database above, the table below, and the round "+" on its right edge that opens its
 * menu. The rest of the box moves it.
 */
function EtlTableNodeViewImpl({ data }: NodeProps<EtlNode>) {
  return (
    <div className="etl-table">
      <Handle type="target" position={Position.Left} isConnectable={false} className="etl-handle" />
      <div className="etl-table__db" title={data.title}>
        {data.title}
      </div>
      <div className="etl-table__name" title={data.subtitle}>
        <i className="di-icon-table" />
        <span className="truncate">{data.subtitle}</span>
      </div>
      <NodeMenu data={data}>
        <button type="button" className="etl-node__menu nodrag" aria-label={`Actions of ${data.subtitle}`}>
          <i className="di-icon-add" />
        </button>
      </NodeMenu>
      <Handle type="source" position={Position.Right} isConnectable={false} className="etl-handle" />
    </div>
  );
}

export const EtlTableNodeView = memo(EtlTableNodeViewImpl);
