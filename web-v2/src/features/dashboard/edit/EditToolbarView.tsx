import { EditOutlined, PlusOutlined, SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';

interface EditToolbarViewProps {
  editing: boolean;
  canEdit: boolean;
  saving: boolean;
  addItems: NonNullable<MenuProps['items']>;
  onEdit: () => void;
  onSettings: () => void;
  onSave: () => void;
}

/** v1 `DashboardControlBar`: Edit in view mode; Adding, Settings and Save in edit mode. */
export function EditToolbarView({ editing, canEdit, saving, addItems, onEdit, onSettings, onSave }: EditToolbarViewProps) {
  if (!editing) {
    return canEdit ? (
      <Button icon={<EditOutlined />} onClick={onEdit}>
        Edit
      </Button>
    ) : null;
  }
  return (
    <span className="flex items-center gap-1">
      <Dropdown trigger={['click']} menu={{ items: addItems }} placement="bottomRight">
        <Button icon={<PlusOutlined />}>Adding</Button>
      </Dropdown>
      <Button icon={<SettingOutlined />} onClick={onSettings}>
        Settings
      </Button>
      <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
        Save
      </Button>
    </span>
  );
}
