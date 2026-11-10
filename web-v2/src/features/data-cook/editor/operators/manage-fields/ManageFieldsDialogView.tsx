import { CodeOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Modal, Popover, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import { toFormula } from '@/features/chart-builder/field-actions/formula.utils';
import { otherFieldNames } from '../manageFields.utils';
import { tableTitle } from '../operators.utils';
import { ExpressionFieldModal } from './ExpressionFieldModal';
import { FieldNameModal } from './FieldNameModal';
import { FieldsTableView } from './FieldsTableView';
import type { FieldsSample } from './useFieldsSample';
import type { ManageFieldsModel } from './useManageFields';

interface ManageFieldsDialogViewProps {
  texts: { title: string; okText: string };
  table: TableSchema;
  model: ManageFieldsModel;
  sample: FieldsSample;
  onCancel: () => void;
}

/** v1 `ManageFields`: the table's fields with a few of their values, the select they make a click away. */
export function ManageFieldsDialogView({ texts, table, model, sample, onCancel }: ManageFieldsDialogViewProps) {
  const { rename, expression } = model;
  const editing = expression.edit?.mode === 'edit' ? model.extraFields[expression.edit.index] : undefined;
  return (
    <Modal open centered title={texts.title} okText={texts.okText} onOk={model.submit} onCancel={onCancel} width={1100} mask={{ closable: false }} destroyOnHidden>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Typography.Text strong className="min-w-0 flex-1" ellipsis>
          Table: {tableTitle(table)}
        </Typography.Text>
        <Input.Search allowClear className="!w-[236px] max-w-full" placeholder="Search fields..." value={model.keyword} onChange={event => model.setKeyword(event.target.value)} />
        <Popover
          trigger="click"
          title="SQL"
          content={<pre className="m-0 max-h-[50vh] max-w-[min(640px,90vw)] overflow-auto text-xs whitespace-pre-wrap">{sample.sql ?? '--'}</pre>}
        >
          <Button icon={<CodeOutlined />}>View SQL</Button>
        </Popover>
        <Button icon={<PlusOutlined />} onClick={() => expression.open({ mode: 'add' })}>
          Add field
        </Button>
      </div>
      {sample.error && (
        <Alert
          className="mb-3"
          type="error"
          showIcon
          title={sample.error}
          action={
            <Button size="small" onClick={sample.retry}>
              Retry
            </Button>
          }
        />
      )}
      <FieldsTableView
        rows={model.rows}
        sample={sample}
        onAsType={model.setAsType}
        onEdit={row => (row.kind === 'field' ? rename.open(row) : expression.open({ mode: 'edit', index: row.index }))}
        onToggle={model.toggleHidden}
        onRemove={expression.remove}
      />
      {rename.row && (
        <FieldNameModal initialName={rename.row.field.displayName} otherNames={otherFieldNames(model.fields, model.extraFields, rename.row)} onSubmit={rename.submit} onCancel={rename.close} />
      )}
      {expression.edit && (
        <ExpressionFieldModal
          okText={editing ? 'Save' : 'Add'}
          table={table}
          initial={{ displayName: editing?.displayName ?? '', formula: editing ? toFormula(editing.expression, table.columns) : '' }}
          otherNames={otherFieldNames(model.fields, model.extraFields, expression.edit.mode === 'edit' ? { kind: 'expression', index: expression.edit.index } : undefined)}
          onSubmit={expression.save}
          onCancel={expression.close}
        />
      )}
    </Modal>
  );
}
