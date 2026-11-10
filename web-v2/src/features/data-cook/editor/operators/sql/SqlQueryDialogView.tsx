import { CaretRightOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import { escapeIdentifier } from '@/features/chart-builder/field-actions/formula.utils';
import { LazyCodeEditor } from '@/shared/code-editor/LazyCodeEditor';
import { QueryResultView } from '@/shared/query-result/QueryResultView';
import { tableTitle } from '../operators.utils';
import type { SqlQueryForm } from './useSqlQueryForm';

interface SqlQueryDialogViewProps {
  texts: { title: string; okText: string };
  table: TableSchema;
  form: SqlQueryForm;
  onCancel: () => void;
}

/** v1 `QueryTable`: the table and its columns on the left, the SQL and its rows on the right. */
export function SqlQueryDialogView({ texts, table, form, onCancel }: SqlQueryDialogViewProps) {
  return (
    <Modal open centered title={texts.title} okText={texts.okText} onOk={form.submit} onCancel={onCancel} width={1200} mask={{ closable: false }} keyboard={false} destroyOnHidden>
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="max-h-[200px] overflow-auto rounded bg-[var(--ant-color-fill-quaternary)] p-3 md:max-h-[560px]" aria-label="Table & Field">
          <Typography.Text strong>Table & Field</Typography.Text>
          <button type="button" className="mt-2 flex w-full cursor-pointer items-center gap-2 truncate border-none bg-transparent p-1 text-left font-medium" title="Put the table in the query" onClick={() => form.insert(escapeIdentifier(table.name))}>
            <i className="di-icon-table" />
            {tableTitle(table)}
          </button>
          <ul className="m-0 list-none p-0 pl-5">
            {table.columns.map(column => (
              <li key={column.name}>
                <button type="button" className="w-full cursor-pointer truncate border-none bg-transparent p-1 text-left" title={column.displayName} onClick={() => form.insert(escapeIdentifier(column.name))}>
                  {column.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <div className="flex min-w-0 flex-col gap-3">
          <LazyCodeEditor
            value={form.sql}
            onChange={form.onChange}
            languageId="etl-sql"
            language={form.language}
            onRun={form.execute}
            handleRef={form.editor}
            lineNumbers
            placeholder={`select * from ${table.name}`}
            ariaLabel="SQL query"
            height={220}
          />
          {form.error && <Alert type="error" showIcon title={form.error} />}
          <div>
            <Button icon={<CaretRightOutlined />} onClick={form.execute} disabled={form.sql.trim() === ''}>
              Execute
            </Button>
          </div>
          <div className="flex h-[300px] min-h-0 flex-col overflow-auto rounded border border-solid border-black/10">
            <QueryResultView result={form.result} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
