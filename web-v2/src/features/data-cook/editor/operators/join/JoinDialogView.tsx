import { DatabaseOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Radio, Select, Typography } from 'antd';
import type { TableSchema } from '@/core/schema/SchemaService';
import { WarehouseTablePicker } from '../../source/WarehouseTablePicker';
import { JOIN_TYPE_OPTIONS } from '../join.utils';
import { tableTitle } from '../operators.utils';
import { JoinConditionsView } from './JoinConditionsView';
import type { JoinDialogModel } from './useJoinDialog';

interface JoinDialogViewProps {
  texts: { title: string; okText: string };
  leftTable: TableSchema;
  /** The right table is picked when adding a join, fixed when editing one. */
  canPickRight: boolean;
  join: JoinDialogModel;
  onCancel: () => void;
}

/** v1 `JoinTable`, with the table to join picked in the dialog (v1 picked it in the table's menu). */
export function JoinDialogView({ texts, leftTable, canPickRight, join, onCancel }: JoinDialogViewProps) {
  const { right, form, conditions, picker } = join;
  return (
    <Modal open centered title={texts.title} okText={texts.okText} onOk={join.submit} onCancel={onCancel} width={720} mask={{ closable: false }} destroyOnHidden>
      <div className="flex flex-col gap-5">
        {join.error && <Alert type="error" showIcon title={join.error} />}
        <div className="grid items-center gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
          <Typography.Text strong>Table</Typography.Text>
          <Typography.Text ellipsis>{tableTitle(leftTable)}</Typography.Text>
          <Typography.Text strong>Join with</Typography.Text>
          {canPickRight ? (
            <div className="flex min-w-0 gap-2">
              <Select
                className="min-w-0 flex-1"
                aria-label="Table to join"
                placeholder="Select a table of this ETL"
                showSearch={{ optionFilterProp: 'label' }}
                value={right && !right.source ? right.operator.destTable.tblName : undefined}
                options={join.rightOptions.map(option => ({ ...option, title: option.disabled ? 'Its preview is not built' : option.label }))}
                onChange={join.pickEtlTable}
              />
              <Button icon={<DatabaseOutlined />} onClick={picker.open}>
                {right?.source ? tableTitle(right.table) : 'Data Warehouse'}
              </Button>
            </div>
          ) : (
            <Typography.Text ellipsis>{right ? tableTitle(right.table) : '--'}</Typography.Text>
          )}
        </div>
        <JoinConditionsView
          left={leftTable}
          right={right?.table}
          conditions={form.conditions}
          onAdd={conditions.add}
          onRemove={conditions.remove}
          onChange={conditions.set}
        />
        <div>
          <Typography.Text strong className="mb-2 block">
            Join Type
          </Typography.Text>
          <Radio.Group value={form.joinType} options={[...JOIN_TYPE_OPTIONS]} onChange={event => join.setJoinType(event.target.value)} />
        </div>
      </div>
      {picker.isOpen && <WarehouseTablePicker title="Select Table to Join" busy={picker.busy} onPick={picker.pick} onCancel={picker.close} />}
    </Modal>
  );
}
