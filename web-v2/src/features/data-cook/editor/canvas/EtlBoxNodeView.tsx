import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EtlNode } from '../graph/etlCanvas.utils';
import type { EtlNodeRef } from '../graph/etlNodeRef';
import { NodeMenu } from './NodeMenu';

/** v1's glyphs: a database for the warehouse and other databases, an envelope for email. */
function iconOf(ref: EtlNodeRef): string {
  return ref.type === 'email' ? 'di-icon-envelope' : 'di-icon-database';
}

/** Where a table goes (v1 `SavedTable`, `ThirdPartyPersistConfig`, `SavedEmailConfig`): the database and the table. */
function EtlBoxNodeViewImpl({ data }: NodeProps<EtlNode>) {
  return (
    <div className="etl-box">
      <Handle type="target" position={Position.Left} isConnectable={false} className="etl-handle" />
      <div className="etl-box__icon">
        <i className={iconOf(data.ref)} />
      </div>
      <div className="etl-box__text">
        <strong className="truncate" title={data.title}>
          {data.title}
        </strong>
        <span className="truncate" title={data.subtitle}>
          {data.subtitle}
        </span>
      </div>
      <NodeMenu data={data}>
        <button type="button" className="etl-node__menu nodrag" aria-label={`Actions of ${data.title} ${data.subtitle}`}>
          <i className="di-icon-add" />
        </button>
      </NodeMenu>
    </div>
  );
}

export const EtlBoxNodeView = memo(EtlBoxNodeViewImpl);
