import { DownOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Space } from 'antd';
import { isAutoRefresh, REFRESH_OPTIONS } from './refresh.utils';
import type { JobsRefresh } from './useJobsListing';

const MENU_ITEMS = REFRESH_OPTIONS.map(option => ({ key: option.key, label: option.label }));

/**
 * v1 `RefreshButton`: reloads on click, the arrow picks how often it reloads by itself. Highlighted while auto
 * refresh is on; the icon spins while a load is in flight (v1 showed a progress bar over the table).
 */
export function JobsRefreshButton({ option, isRefreshing, onRefresh, onSelectOption }: JobsRefresh) {
  const type = isAutoRefresh(option) ? 'primary' : 'default';

  return (
    <Space.Compact>
      <Button
        type={type}
        icon={<ReloadOutlined spin={isRefreshing} />}
        aria-label={option.label}
        title={option.label}
        onClick={onRefresh}
      >
        <span className="hidden sm:inline">{option.label}</span>
      </Button>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items: MENU_ITEMS,
          selectable: true,
          selectedKeys: [option.key],
          onClick: ({ key }) => onSelectOption(key)
        }}
      >
        <Button type={type} icon={<DownOutlined />} aria-label="Refresh options" />
      </Dropdown>
    </Space.Compact>
  );
}
