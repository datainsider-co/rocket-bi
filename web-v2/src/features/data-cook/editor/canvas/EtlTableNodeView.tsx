import { memo } from 'react';
import { ExclamationCircleFilled, LoadingOutlined } from '@ant-design/icons';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { EtlNode, NodePreview } from '../graph/etlCanvas.utils';
import { NodeMenu } from './NodeMenu';

function tableClass(preview: NodePreview | undefined): string {
  const classes = ['etl-table'];
  if (preview?.status === 'error') classes.push('etl-table--error');
  if (preview?.shown) classes.push('etl-table--shown');
  return classes.join(' ');
}

/** v1 `TableItem`'s spinner while the table is built, its red mark when that failed. */
function PreviewMark({ preview }: { preview: NodePreview | undefined }) {
  if (preview?.status === 'loading') return <LoadingOutlined aria-label="Previewing" />;
  if (preview?.status === 'error') return <ExclamationCircleFilled className="etl-table__error" aria-label="Preview failed" />;
  return <i className="di-icon-table" />;
}

/**
 * A table (v1 `TableItem`): the database above, the table below, and the round "+" on its right edge that opens its
 * menu. The rest of the box moves it; a click shows its rows below the canvas.
 */
function EtlTableNodeViewImpl({ data }: NodeProps<EtlNode>) {
  const { preview } = data;
  return (
    <div className={tableClass(preview)} title={preview?.status === 'error' ? preview.message : undefined}>
      <Handle type="target" position={Position.Left} isConnectable={false} className="etl-handle" />
      <div className="etl-table__db" title={data.title}>
        {data.title}
      </div>
      <div className="etl-table__name" title={data.subtitle}>
        <PreviewMark preview={preview} />
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
