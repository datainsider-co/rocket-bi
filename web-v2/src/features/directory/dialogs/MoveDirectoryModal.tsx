import { Alert, Button, List, Modal, Typography } from 'antd';
import type { Directory } from '@/core/directory/Directory';
import { useFolderPicker } from './useFolderPicker';

interface MoveDirectoryModalProps {
  directory: Directory;
  /** What happens to `directory` in the picked folder: `Move` by default, `Copy` for a copy. */
  verb?: string;
  /** The picked folder; its name is `My Data` for the root. */
  onSelect: (toParentId: number, folderName: string) => void;
  onCancel: () => void;
}

/**
 * Picks the folder to move or copy `directory` into (v1 `MyDataPickDirectory`). Mount it only while picking, so each
 * time starts at My Data.
 */
export function MoveDirectoryModal({ directory, verb = 'Move', onSelect, onCancel }: MoveDirectoryModalProps) {
  const picker = useFolderPicker(directory.id);

  return (
    <Modal
      open
      title={`${verb} "${directory.name}" to`}
      okText="Select"
      onOk={() => onSelect(picker.current.id, picker.current.name)}
      onCancel={onCancel}
    >
      <div className="mb-2 flex items-center gap-2">
        {picker.canGoBack && (
          <Button type="text" size="small" aria-label="Back" icon={<i className="di-icon-arrow-left" />} onClick={picker.back} />
        )}
        <Typography.Text strong>{picker.current.name}</Typography.Text>
      </div>
      {picker.error ? (
        <Alert type="error" showIcon title={picker.error} />
      ) : (
        <List<Directory>
          className="max-h-[236px] overflow-auto"
          bordered
          size="small"
          loading={picker.isLoading}
          dataSource={picker.folders}
          locale={{ emptyText: 'No folders' }}
          renderItem={folder => (
            <List.Item className="cursor-pointer" onClick={() => picker.open(folder)}>
              <span className="flex items-center gap-2">
                <img src="/directory/directory.svg" alt="" width={18} height={18} />
                {folder.name}
              </span>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
