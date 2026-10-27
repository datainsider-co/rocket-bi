import { Button, Tooltip } from 'antd';
import type { Directory } from '@/core/directory/Directory';

interface ShareButtonProps {
  directory: Directory;
  onShare: (directory: Directory) => void;
}

/** v1's share icon in a row, hidden below `sm` like v1's `d-none d-sm-block`. */
export function ShareButton({ directory, onShare }: ShareButtonProps) {
  return (
    <Tooltip title="Share">
      <Button
        type="text"
        shape="circle"
        size="small"
        className="hidden sm:inline-flex"
        aria-label={`Share ${directory.name}`}
        icon={<i className="di-icon-share text-base" />}
        onClick={event => {
          // Keeps the click from reaching the row.
          event.stopPropagation();
          onShare(directory);
        }}
      />
    </Tooltip>
  );
}
