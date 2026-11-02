import type { ReactElement } from 'react';
import { Dropdown, type MenuProps } from 'antd';
import type { EtlNodeData } from '../graph/etlCanvas.utils';

interface NodeMenuProps {
  data: EtlNodeData;
  /** What opens the menu on a click. */
  children: ReactElement;
}

/** A box's menu (v1 context menus), opened by a click on `children`. */
export function NodeMenu({ data, children }: NodeMenuProps) {
  const items: MenuProps['items'] = data.menu.map(({ key, label, disabled, title, danger }) => ({ key, label, disabled, title, danger }));
  return (
    <Dropdown trigger={['click']} menu={{ items, onClick: ({ key }) => data.onMenu(data.ref, key) }}>
      {children}
    </Dropdown>
  );
}
