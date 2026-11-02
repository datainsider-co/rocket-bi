import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Form, Input, List, Modal, Typography } from 'antd';
import { useForm } from 'react-hook-form';
import type { Directory } from '@/core/directory/Directory';
import { nameSchema, type NameForm } from '@/features/directory/directory.utils';
import { useFolderPicker } from '@/features/directory/dialogs/useFolderPicker';
import { FormField } from '@/shared/form/FormField';

interface SaveAnalysisModalProps {
  creating: boolean;
  /** The server's message of the last try. */
  error: string | undefined;
  onSubmit: (name: string, folderId: number) => void;
  onCancel: () => void;
}

/**
 * Where and under which name to save the analysis (v1 `MyDataPickDirectory`, then `DiRenameModal` "Create Analysis"),
 * in one dialog. Mounted while open, so it starts at My Data.
 */
export function SaveAnalysisModal({ creating, error, onSubmit, onCancel }: SaveAnalysisModalProps) {
  const picker = useFolderPicker();
  const { control, handleSubmit, setFocus } = useForm<NameForm>({ resolver: zodResolver(nameSchema), defaultValues: { name: '' } });
  const submit = handleSubmit(values => onSubmit(values.name, picker.current.id));

  return (
    <Modal open title="Save Analysis" okText="Create" confirmLoading={creating} onOk={() => void submit()} onCancel={onCancel} destroyOnHidden afterOpenChange={visible => visible && setFocus('name')}>
      <Form layout="vertical" component={false}>
        <FormField control={control} name="name" label="Analysis name" render={field => <Input {...field} placeholder="Type analysis name" onPressEnter={() => void submit()} />} />
      </Form>
      <div className="mb-2 flex items-center gap-2">
        {picker.canGoBack && <Button type="text" size="small" aria-label="Back" icon={<i className="di-icon-arrow-left" />} onClick={picker.back} />}
        <Typography.Text>
          In <Typography.Text strong>{picker.current.name}</Typography.Text>
        </Typography.Text>
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
      {error && <Alert className="mt-3" type="error" showIcon title={error} />}
    </Modal>
  );
}
