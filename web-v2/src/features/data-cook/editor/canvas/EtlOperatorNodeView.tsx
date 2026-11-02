import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EtlNode } from '../graph/etlCanvas.utils';
import { NodeMenu } from './NodeMenu';

/** An operator between its parents and its table (v1 `OperatorType`): a rhombus with its name; a click opens its menu. */
function EtlOperatorNodeViewImpl({ data }: NodeProps<EtlNode>) {
  return (
    <NodeMenu data={data}>
      <button type="button" className="etl-operator" aria-label={`${data.title} of ${data.ref.tblName}`}>
        <Handle type="target" position={Position.Left} isConnectable={false} className="etl-handle" />
        <svg viewBox="0 0 120 76" aria-hidden="true">
          <polygon points="1,38 60,1 119,38 60,75" />
        </svg>
        <span className="etl-operator__label">{data.title}</span>
        <Handle type="source" position={Position.Right} isConnectable={false} className="etl-handle" />
      </button>
    </NodeMenu>
  );
}

export const EtlOperatorNodeView = memo(EtlOperatorNodeViewImpl);
