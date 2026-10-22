import { Button, Tooltip } from 'antd';
import type { Directory } from '@/core/directory/Directory';

interface TrashActionsProps {
  directory: Directory;
  onRestore: (directory: Directory) => void;
  onDeleteForever: (directory: Directory) => void;
}

/** v1's Trash row: restore or delete for good. */
export function TrashActions({ directory, onRestore, onDeleteForever }: TrashActionsProps) {
  return (
    <span className="flex gap-5">
      <Tooltip title="Restore">
        <Button
          type="text"
          shape="circle"
          size="small"
          aria-label={`Restore ${directory.name}`}
          icon={<i className="di-icon-restore text-base" />}
          onClick={event => {
            // Keeps the click from reaching the row.
            event.stopPropagation();
            onRestore(directory);
          }}
        />
      </Tooltip>
      <Tooltip title="Delete">
        <Button
          type="text"
          shape="circle"
          size="small"
          aria-label={`Delete ${directory.name}`}
          icon={<i className="di-icon-delete text-base" />}
          onClick={event => {
            event.stopPropagation();
            onDeleteForever(directory);
          }}
        />
      </Tooltip>
    </span>
  );
}
