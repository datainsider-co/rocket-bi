import { Dropdown, type MenuProps } from 'antd';
import { familyOptionsOf, typeOptionsOf } from '@/core/chart-builder/functionOptions';
import type { FunctionData } from '@/core/chart-builder/FunctionData';
import { FIELD_NO_DRAG_CLASS } from '@/shared/field-dnd/FieldPointerSensor';
import type { TableNode } from '../field-tree/fieldTree.utils';
import type { DroppedField } from '../state/builderState.utils';
import { FieldMenuView } from './FieldMenuView';
import { MenuLinkView } from './MenuLinkView';
import './ConfigPanel.css';
import { showsFamily, showsType, SORT_OPTIONS, topNLabel, withFamily } from './zoneItem.utils';

/** The item's "..." menu. */
export interface ItemMenu {
  onConfig: () => void;
  onRemove: () => void;
  /** On a measure: edits its formula (v1 `ConfigDraggable.editExpression`). */
  onEditMeasure?: () => void;
}

interface ZoneItemViewProps {
  item: FunctionData;
  /** In the Sorting zone, the item shows its sorting and top N. */
  sorting: boolean;
  /** Tables to pick another field from by clicking the name. */
  tables: readonly TableNode[];
  onChange: (item: FunctionData) => void;
  onPickField: (field: DroppedField) => void;
  menu: ItemMenu;
}

const asItems = (keys: readonly string[]): NonNullable<MenuProps['items']> => keys.map(key => ({ key, label: key }));

/** An item of a zone (v1 `DraggableItem`): its family, type and sorting as menus, its name, and a menu to config or remove it. */
export function ZoneItemView({ item, sorting, tables, onChange, onPickField, menu }: ZoneItemViewProps) {
  const typeItems = typeOptionsOf(item.field, item.functionFamily).map((group, index) =>
    group.label ? { type: 'group' as const, key: group.label, label: group.label, children: asItems(group.types) } : { type: 'group' as const, key: `types-${index}`, children: asItems(group.types) }
  );
  const topN = sorting ? topNLabel(item) : undefined;
  const source = [item.tableName, item.columnName].filter(Boolean).join('.');

  return (
    <div className="zone-item">
      <div className="zone-item__contents">
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
        {item.dynamicFunction ? (
          <span className="zone-item__name" title={item.name}>
            {item.name}
          </span>
        ) : (
          // v1 `handleClickChangeField`: the name opens the tables to swap the field.
          <FieldMenuView tables={tables} onPick={onPickField}>
            <button type="button" title={source || item.name} aria-label={`Change field of ${item.name}`} className="zone-item__name">
              {item.name}
            </button>
          </FieldMenuView>
        )}
        {sorting && (
          <MenuLinkView label={item.sorting} ariaLabel={`Sorting of ${item.name}`} items={asItems(SORT_OPTIONS)} selected={item.sorting} onSelect={value => onChange({ ...item, sorting: value })} />
        )}
        {topN && <span className="zone-item__top">{topN}</span>}
      </div>
      <Dropdown
        trigger={['click']}
        menu={{
          // v1 lists Remove like the others.
          items: [...(menu.onEditMeasure ? [{ key: 'measure', label: 'Edit Measure' }] : []), { key: 'config', label: 'Config' }, { key: 'remove', label: 'Remove' }],
          onClick: ({ key }) => (key === 'measure' ? menu.onEditMeasure?.() : key === 'config' ? menu.onConfig() : menu.onRemove())
        }}
      >
        <button type="button" className={`zone-more ${FIELD_NO_DRAG_CLASS}`} aria-label={`More actions for ${item.name}`}>
          <i className="di-icon-three-dot" aria-hidden />
        </button>
      </Dropdown>
    </div>
  );
}
