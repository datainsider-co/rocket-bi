import { MoreOutlined } from '@ant-design/icons';
import { Button, Dropdown, type MenuProps } from 'antd';
import { familyOptionsOf, typeOptionsOf } from '@/core/chart-builder/functionOptions';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { MenuLinkView } from './MenuLinkView';
import { showsFamily, showsType, SORT_OPTIONS, topNLabel, withFamily } from './zoneItem.utils';

interface ZoneItemViewProps {
  item: FunctionData;
  /** In the Sorting zone, the item shows its sorting and top N. */
  sorting: boolean;
  onChange: (item: FunctionData) => void;
  onConfig: () => void;
  onRemove: () => void;
}

const asItems = (keys: readonly string[]): NonNullable<MenuProps['items']> => keys.map(key => ({ key, label: key }));

/** An item of a zone (v1 `DraggableItem`): its family, type and sorting as menus, its name, and a menu to config or remove it. */
export function ZoneItemView({ item, sorting, onChange, onConfig, onRemove }: ZoneItemViewProps) {
  const typeItems = typeOptionsOf(item.field, item.functionFamily).map((group, index) =>
    group.label ? { type: 'group' as const, key: group.label, label: group.label, children: asItems(group.types) } : { type: 'group' as const, key: `types-${index}`, children: asItems(group.types) }
  );
  const topN = sorting ? topNLabel(item) : undefined;
  const source = [item.tableName, item.columnName].filter(Boolean).join('.');

  return (
    <div className="flex min-h-8 items-center gap-1 rounded bg-black/[0.03] py-1 pr-1 pl-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1">
        {showsFamily(item) && (
          <MenuLinkView
            label={item.functionFamily}
            ariaLabel={`Function of ${item.name}`}
            items={asItems(familyOptionsOf(item.field))}
            selected={item.functionFamily}
            onSelect={family => onChange(withFamily(item, family))}
          />
        )}
        {showsType(item) && (
          <MenuLinkView
            label={item.functionType ?? ''}
            ariaLabel={`Function type of ${item.name}`}
            items={typeItems}
            selected={item.functionType ?? ''}
            onSelect={functionType => onChange({ ...item, functionType })}
          />
        )}
        <span className="truncate font-medium" title={source || item.name}>
          {item.name}
        </span>
        {sorting && (
          <MenuLinkView label={item.sorting} ariaLabel={`Sorting of ${item.name}`} items={asItems(SORT_OPTIONS)} selected={item.sorting} onSelect={value => onChange({ ...item, sorting: value })} />
        )}
        {topN && <span className="text-xs whitespace-nowrap text-black/45">{topN}</span>}
      </div>
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            { key: 'config', label: 'Config' },
            { key: 'remove', label: 'Remove', danger: true }
          ],
          onClick: ({ key }) => (key === 'config' ? onConfig() : onRemove())
        }}
      >
        <Button type="text" size="small" icon={<MoreOutlined />} aria-label={`More actions for ${item.name}`} />
      </Dropdown>
    </div>
  );
}
