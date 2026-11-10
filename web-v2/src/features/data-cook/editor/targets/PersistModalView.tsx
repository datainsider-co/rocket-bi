import { AutoComplete, Form, Modal, Radio, Typography } from 'antd';
import { PERSIST_TYPES } from './persist.utils';
import type { PersistFormModel } from './usePersistForm';

interface PersistModalViewProps {
  /** Add, or Update for a table already saved. */
  okText: string;
  form: PersistFormModel;
  onCancel: () => void;
}

const matches = (input: string, option?: { label?: string; value?: string }) =>
  `${option?.label ?? ''} ${option?.value ?? ''}`.toLowerCase().includes(input.trim().toLowerCase());

/** v1 `SaveToDataWareHouse`: the database, the table and the write type. */
export function PersistModalView({ okText, form, onCancel }: PersistModalViewProps) {
  const { errors } = form;
  return (
    <Modal open centered title="Save to Data Warehouse" okText={okText} width={480} onOk={form.submit} onCancel={onCancel} destroyOnHidden>
      <Form layout="vertical" component={false}>
        <Form.Item label="Database" validateStatus={errors.database ? 'error' : undefined} help={errors.database}>
          <AutoComplete
            aria-label="Database"
            placeholder="Select or create new database"
            value={form.form.database}
            options={form.databaseOptions}
            filterOption={matches}
            onChange={form.setDatabase}
          />
        </Form.Item>
        <Form.Item label="Table" validateStatus={errors.table ? 'error' : undefined} help={errors.table}>
          <AutoComplete
            aria-label="Table"
            placeholder={form.loadingTables ? 'Loading tables...' : 'Select or create new table'}
            value={form.form.table}
            options={form.tableOptions}
            filterOption={matches}
            onChange={form.setTable}
          />
        </Form.Item>
        <Form.Item label="Type" className="mb-1!">
          <Radio.Group value={form.form.type} options={PERSIST_TYPES.map(type => ({ value: type, label: type }))} onChange={event => form.setType(event.target.value)} />
        </Form.Item>
        <Typography.Text type="warning" className="block min-h-5 text-xs">
          {form.hint}
        </Typography.Text>
      </Form>
    </Modal>
  );
}
