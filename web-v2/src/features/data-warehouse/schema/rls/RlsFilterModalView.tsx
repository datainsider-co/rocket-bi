import { Fragment } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Dropdown, Empty, Modal, Typography } from 'antd';
import { ConditionEditor } from '@/features/chart-builder/config-panel/filter/ConditionEditor';
import { conditionChips } from '@/features/chart-builder/config-panel/filter/conditionEditor.utils';
import { ConditionItemView } from '@/features/chart-builder/config-panel/filter/ConditionItemView';
import { fieldOfKey } from '@/features/chart-builder/config-panel/fieldMenu.utils';
import { columnMenuItems } from './rlsFilter.utils';
import type { RlsFilter } from './useRlsFilter';

interface RlsFilterModalViewProps {
  title: string;
  filter: RlsFilter;
  onApply: () => void;
  onCancel: () => void;
}

/** Outside a dashboard: no chart controls to take values from. */
const NO_CONTROLS = { controls: [] };

/**
 * A policy's Custom filter (v1 opened the ChartBuilder with only its Filters zone, `RLSFilterBuilderConfig`): the
 * table's columns in and-groups, or-ed, each condition edited with the builder's condition editor.
 */
export function RlsFilterModalView({ title, filter, onApply, onCancel }: RlsFilterModalViewProps) {
  const { groups, tables } = filter;
  const items = columnMenuItems(tables);
  const addButton = (label: string, groupId?: number) => (
    <Dropdown
      trigger={['click']}
      menu={{
        items,
        onClick: ({ key }) => {
          const field = fieldOfKey(tables, key);
          if (field) filter.onAdd(field, groupId);
        }
      }}
    >
      <Button type="link" size="small" icon={<PlusOutlined />} className="self-start px-0">
        {label}
      </Button>
    </Dropdown>
  );
  return (
    <Modal open title={title} width={560} okText="Apply" okButtonProps={{ disabled: filter.conditions.length === 0 }} onOk={onApply} onCancel={onCancel} destroyOnHidden>
      <div className="flex flex-col gap-2">
        {filter.skipped > 0 && <Alert type="warning" showIcon title={`${filter.skipped} condition(s) of this policy can't be edited here; Apply replaces them.`} />}
        {groups.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pick a column to filter the rows on" />}
        {groups.map(([groupId, conditions], index) => (
          <Fragment key={groupId}>
            {index > 0 && <div className="text-center text-xs text-black/45">OR</div>}
            <fieldset aria-label={`AND group ${index + 1}`} className="m-0 flex min-w-0 flex-col rounded-md border border-solid border-black/10 px-2 py-1">
              {conditions.map(condition => (
                <ConditionItemView
                  key={condition.id}
                  condition={condition}
                  chips={conditionChips(condition, [])}
                  tables={tables}
                  onPickField={field => filter.onSwapField(condition, field)}
                  onRemove={() => filter.onRemove(condition)}
                  renderEditor={close => (
                    <ConditionEditor
                      condition={condition}
                      context={NO_CONTROLS}
                      onApply={next => {
                        filter.onApply(next);
                        close();
                      }}
                      onRemove={() => {
                        close();
                        filter.onRemove(condition);
                      }}
                      onCancel={close}
                    />
                  )}
                />
              ))}
              {addButton('And', groupId)}
            </fieldset>
          </Fragment>
        ))}
        {addButton(groups.length === 0 ? 'Add condition' : 'Or')}
        {groups.length > 0 && filter.conditions.length === 0 && <Typography.Text type="secondary">Click a condition to give it values.</Typography.Text>}
      </div>
    </Modal>
  );
}
