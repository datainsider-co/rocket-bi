import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import type { DataSource } from '@/core/ingestion/DataSource';
import { isEditableSource, NOT_EDITABLE_TEXT } from './sources.utils';

export interface SourceRowActions {
  readonly onEdit: (source: DataSource) => void;
  readonly onDelete: (source: DataSource) => void;
  /** A click on the row: a new job on the source. */
  readonly onCreateJob: (source: DataSource) => void;
}

/** v1 `renderDataSourceAction`: Edit (disabled for types v2 can't edit) and Delete. Clicks don't reach the row. */
export function SourceActionsCell({ source, actions }: { source: DataSource; actions: SourceRowActions }) {
  const editable = isEditableSource(source);

  return (
    <span className="flex items-center gap-1">
      <Tooltip title={editable ? 'Edit' : NOT_EDITABLE_TEXT}>
        <Button
          type="text"
          aria-label={`Edit ${source.displayName}`}
          icon={<EditOutlined />}
          disabled={!editable}
          onClick={event => {
            event.stopPropagation();
            actions.onEdit(source);
          }}
        />
      </Tooltip>
      <Tooltip title="Delete">
        <Button
          type="text"
          danger
          aria-label={`Delete ${source.displayName}`}
          icon={<DeleteOutlined />}
          onClick={event => {
            event.stopPropagation();
            actions.onDelete(source);
          }}
        />
      </Tooltip>
    </span>
  );
}
