import { Alert, Button, List, Modal, Typography } from 'antd';
import type { Directory } from '@/core/directory/Directory';
import { useFolderPicker } from './useFolderPicker';

interface MoveDirectoryModalProps {
  directory: Directory;
  onSelect: (toParentId: number) => void;
  onCancel: () => void;
}

/** Picks the folder to move `directory` into. Mount it only while moving, so each move starts at My Data. */
export function MoveDirectoryModal({ directory, onSelect, onCancel }: MoveDirectoryModalProps) {
  const picker = useFolderPicker(directory.id);

  return (
    <Modal
      open
      title={`Move "${directory.name}" to`}
      okText="Select"
      onOk={() => onSelect(picker.current.id)}
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
