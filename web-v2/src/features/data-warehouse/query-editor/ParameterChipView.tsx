import { SettingOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import type { QueryParameter } from '@/core/query/queryParameters';
import { ParameterValueInput } from './ParameterValueInput';

export interface ParameterChipActions {
  readonly onValueChange: (name: string, value: string) => void;
  readonly onSetDefault: (name: string) => void;
  readonly onEdit: (parameter: QueryParameter) => void;
  readonly onDelete: (parameter: QueryParameter) => void;
}

interface ParameterChipViewProps {
  /** Its definition, whose value is the default. */
  definition: QueryParameter;
  /** With the value picked on the page. */
  current: QueryParameter;
  actions: ParameterChipActions;
  /** Edit, Set Value as Default and Delete; read only, the value can still be picked. */
  editable: boolean;
}

/** One parameter on the bar (v1 `ParamItem`): its name, its value, and Edit / Set Value as Default / Delete. */
export function ParameterChipView({ definition, current, actions, editable }: ParameterChipViewProps) {
  const name = definition.displayName;
  const items: MenuProps['items'] = [
    ...(editable ? [{ key: 'edit', label: 'Edit' }] : []),
    ...(current.value === definition.value || !editable ? [] : [{ key: 'default', label: 'Set Value as Default' }]),
    ...(editable ? [{ key: 'delete', label: 'Delete', danger: true }] : [])
  ];
  const onMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'edit') actions.onEdit(definition);
    else if (key === 'default') actions.onSetDefault(name);
    else actions.onDelete(definition);
  };

  return (
    <div className="flex items-center gap-2 rounded bg-[var(--color-brand)]/10 py-1 pr-1 pl-3" data-testid={`parameter-${name}`}>
      <span className="font-medium text-[var(--color-brand)]">{name}</span>
      <ParameterValueInput key={`${current.valueType}:${current.value}`} parameter={current} onChange={value => actions.onValueChange(name, value)} />
      {items.length > 0 && (
        <Dropdown menu={{ items, onClick: onMenu }} trigger={['click']}>
          <Button type="text" size="small" icon={<SettingOutlined />} aria-label={`Configure ${name}`} />
        </Dropdown>
      )}
    </div>
  );
}
