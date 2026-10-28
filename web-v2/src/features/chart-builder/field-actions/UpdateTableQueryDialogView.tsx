import { Alert, Modal, Skeleton, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import type { EditorLanguage } from './completions.utils';
import { LazyCodeEditor } from './editor/LazyCodeEditor';

interface UpdateTableQueryDialogViewProps {
  table: Pick<TableSchema, 'dbName' | 'name' | 'displayName'>;
  query: { value: string; onChange: (query: string) => void };
  /** The editor's suggestions; none while the data source's functions load. */
  language?: EditorLanguage;
  saving: boolean;
  /** The server's message when the query was refused. */
  error?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

const EDITOR_HEIGHT = 420;

/** The query of a view, to replace (v1 `UpdateTableByQueryModal`, without its query runner). */
export function UpdateTableQueryDialogView({ table, query, language, saving, error, onSubmit, onCancel }: UpdateTableQueryDialogViewProps) {
  return (
    <Modal
      open
      title={
        <span className="flex items-center gap-2">
          <i className="di-icon-database" aria-hidden />
          {table.dbName}
          <span aria-hidden>›</span>
          {table.displayName || table.name}
        </span>
      }
      width={960}
      okText="Update"
      okButtonProps={{ disabled: query.value.trim() === '' }}
      onOk={onSubmit}
      confirmLoading={saving}
      onCancel={onCancel}
      mask={{ closable: false }}
      destroyOnHidden
    >
      <Typography.Paragraph type="secondary">The table takes the columns this query returns. Its measures and calculated fields are kept when the new query still has what they use.</Typography.Paragraph>
      {language ? (
        <LazyCodeEditor value={query.value} onChange={query.onChange} languageId="di-sql" language={language} placeholder="SELECT ..." ariaLabel="Query" height={EDITOR_HEIGHT} />
      ) : (
        <Skeleton.Node active style={{ width: '100%', height: EDITOR_HEIGHT }} />
      )}
      {error && <Alert className="!mt-3" type="error" showIcon message={error} />}
    </Modal>
  );
}
