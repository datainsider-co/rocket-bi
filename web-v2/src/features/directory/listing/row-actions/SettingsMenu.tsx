import { Button, Dropdown } from 'antd';
import type { Directory } from '@/core/directory/Directory';
import { DirectoryAction } from '../../directory.utils';

const ACTION_MENU: Record<DirectoryAction, { label: string; icon: string }> = {
  [DirectoryAction.Rename]: { label: 'Rename', icon: 'di-icon-rename' },
  [DirectoryAction.Move]: { label: 'Move to', icon: 'di-icon-move-folder' },
  [DirectoryAction.Star]: { label: 'Add to starred', icon: 'di-icon-add-to-star-converted' },
  [DirectoryAction.Unstar]: { label: 'Remove from starred', icon: 'di-icon-add-to-star-converted' },
  [DirectoryAction.Remove]: { label: 'Remove', icon: 'di-icon-delete' }
};

interface SettingsMenuProps {
  directory: Directory;
  actions: readonly DirectoryAction[];
  onAction: (directory: Directory, action: DirectoryAction) => void;
}

/** v1's gear menu of a row. */
export function SettingsMenu({ directory, actions, onAction }: SettingsMenuProps) {
  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items: actions.map(action => ({
          key: action,
          label: ACTION_MENU[action].label,
          icon: <i className={ACTION_MENU[action].icon} />,
          danger: action === DirectoryAction.Remove
        })),
        onClick: ({ key, domEvent }) => {
          // The menu is portaled, but its clicks still bubble to the row through React.
          domEvent.stopPropagation();
          onAction(directory, key as DirectoryAction);
        }
      }}
    >
      <Button
        type="text"
        shape="circle"
        size="small"
        aria-label={`Settings of ${directory.name}`}
        icon={<i className="di-icon-setting text-base" />}
        onClick={event => event.stopPropagation()}
      />
    </Dropdown>
  );
}
