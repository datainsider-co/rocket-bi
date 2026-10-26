import { useState } from 'react';
import { Modal, Select, Typography } from 'antd';
import type { UserOption } from './viewAs.utils';

interface ViewAsModalViewProps {
  options: readonly UserOption[];
  loading: boolean;
  onSearch: (keyword: string) => void;
  /** The username picked. */
  onPick: (username: string) => void;
  onCancel: () => void;
}

/** v1 `RLSViewAsModal`: find a user by name or email, then see the dashboard as they would. */
export function ViewAsModalView({ options, loading, onSearch, onPick, onCancel }: ViewAsModalViewProps) {
  const [picked, setPicked] = useState<string>();
  return (
    <Modal open centered title="View As" okText="View As" okButtonProps={{ disabled: !picked }} onOk={() => picked && onPick(picked)} onCancel={onCancel}>
      <Typography.Paragraph type="secondary">Charts follow the row level security of the user you pick.</Typography.Paragraph>
      <Select
        showSearch={{ filterOption: false, onSearch }}
        aria-label="User"
        className="w-full"
        placeholder="Search a user by name or email"
        loading={loading}
        value={picked}
        onChange={setPicked}
        options={options.map(option => ({
          value: option.value,
          title: option.label,
          label: (
            <span>
              {option.label} {option.email && option.email !== option.label && <Typography.Text type="secondary">{option.email}</Typography.Text>}
            </span>
          )
        }))}
        notFoundContent={loading ? 'Loading...' : 'No user found'}
      />
    </Modal>
  );
}
