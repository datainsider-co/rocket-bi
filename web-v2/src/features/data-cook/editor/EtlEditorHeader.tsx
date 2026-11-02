import { EditOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { PageHeader } from '@/shared/layout/PageHeader';
import { DataCookSection, getDataCookSection } from '../dataCook.utils';

const MY_ETL = getDataCookSection(DataCookSection.MyEtl);

interface EtlEditorHeaderProps {
  /** Left out while the ETL loads. */
  editor?: {
    displayName: string;
    isAdding: boolean;
    onRename: () => void;
    onAddSource: () => void;
  };
}

/** v1 `ManageEtlJob` header: "My ETL › <name>" with its pencil, Add Source on the right. */
export function EtlEditorHeader({ editor }: EtlEditorHeaderProps) {
  return (
    <PageHeader
      icon={MY_ETL.icon}
      title={MY_ETL.title}
      trail={
        editor && (
          <span className="flex min-w-0 items-center gap-3 text-lg">
            <RightOutlined className="text-xs text-black/45" />
            <Typography.Text className="!text-lg" ellipsis={{ tooltip: editor.displayName }}>
              {editor.displayName}
            </Typography.Text>
            <Button type="text" size="small" icon={<EditOutlined />} aria-label="Rename ETL" onClick={editor.onRename} />
          </span>
        )
      }
      actions={
        editor && (
          <Button type="primary" icon={<PlusOutlined />} loading={editor.isAdding} onClick={editor.onAddSource}>
            Add Source
          </Button>
        )
      }
    />
  );
}
