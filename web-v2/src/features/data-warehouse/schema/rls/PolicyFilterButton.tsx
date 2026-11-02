import { DownOutlined, FilterOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import type { PolicyFilterKind } from './rls.utils';

interface PolicyFilterButtonProps {
  kind: PolicyFilterKind;
  /** The custom filter in words. */
  summary: string;
  onPick: (choice: 'all' | 'nothing' | 'custom') => void;
  ariaLabel: string;
}

const LABELS: Readonly<Record<PolicyFilterKind, string>> = { all: 'View All', nothing: 'View Nothing', custom: 'Custom', none: 'Add Filter' };

/** What the policy's users see, picked from v1's menu: View All, View Nothing, or a Custom filter. */
export function PolicyFilterButton({ kind, summary, onPick, ariaLabel }: PolicyFilterButtonProps) {
  const items = [
    { key: 'all', label: 'View All' },
    { key: 'nothing', label: 'View Nothing' },
    { key: 'custom', label: kind === 'custom' ? 'Edit custom filter...' : 'Custom...' }
  ];
  return (
    <Dropdown trigger={['click']} menu={{ items, onClick: ({ key }) => onPick(key as 'all' | 'nothing' | 'custom') }}>
      <Button aria-label={ariaLabel} className="max-w-full" icon={kind === 'custom' ? <FilterOutlined /> : undefined} title={kind === 'custom' ? summary : undefined}>
        <span className="truncate">{kind === 'custom' ? summary || LABELS.custom : LABELS[kind]}</span>
        <DownOutlined className="text-xs" aria-hidden />
      </Button>
    </Dropdown>
  );
}
