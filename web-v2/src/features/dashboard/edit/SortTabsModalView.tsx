import { useState } from 'react';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Button, List, Modal } from 'antd';
import { moveInOrder } from './tabEdit.utils';

interface SortTabsModalViewProps {
  names: readonly string[];
  /** The tabs' current indexes, in their new order. */
  onSubmit: (order: number[]) => Promise<void>;
  onCancel: () => void;
}

/** v1 `SortModal`: the tabs in a new order. Buttons move one step, where v1 dragged. */
export function SortTabsModalView({ names, onSubmit, onCancel }: SortTabsModalViewProps) {
  const [order, setOrder] = useState(() => names.map((_name, index) => index));
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit(order);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open centered title="Sort tabs" okText="Save" okButtonProps={{ loading: saving }} onOk={() => void submit()} onCancel={onCancel}>
      <List
        size="small"
        dataSource={order}
        renderItem={(tab, position) => (
          <List.Item
            actions={[
              <Button key="up" type="text" size="small" icon={<ArrowUpOutlined />} aria-label={`Move ${names[tab]} up`} disabled={position === 0} onClick={() => setOrder(moveInOrder(order, position, -1))} />,
              <Button
                key="down"
                type="text"
                size="small"
                icon={<ArrowDownOutlined />}
                aria-label={`Move ${names[tab]} down`}
                disabled={position === order.length - 1}
                onClick={() => setOrder(moveInOrder(order, position, 1))}
              />
            ]}
          >
            {names[tab] || 'Untitled tab'}
          </List.Item>
        )}
      />
    </Modal>
  );
}
