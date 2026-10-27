import { Dropdown, type MenuProps } from 'antd';

interface MenuLinkViewProps {
  label: string;
  /** Names the menu for screen readers, e.g. "Function of revenue". */
  ariaLabel: string;
  items: NonNullable<MenuProps['items']>;
  selected: string;
  onSelect: (key: string) => void;
}

/** A word of a zone item that opens a menu to change it (v1 `DraggableItem` links with their `vue-context` menus). */
export function MenuLinkView({ label, ariaLabel, items, selected, onSelect }: MenuLinkViewProps) {
  return (
    <Dropdown trigger={['click']} disabled={items.length === 0} menu={{ items, selectable: true, selectedKeys: [selected], onClick: ({ key }) => onSelect(key) }}>
      <button type="button" aria-label={ariaLabel} className="cursor-pointer rounded border-0 bg-transparent px-1 text-inherit underline decoration-dotted hover:bg-black/5">
        {label}
      </button>
    </Dropdown>
  );
}
