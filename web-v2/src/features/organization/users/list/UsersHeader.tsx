import { Button, Input } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { PageHeader } from '@/shared/layout/PageHeader';
import { getOrganizationSection, OrganizationSection } from '../../organization.utils';

export interface UsersHeaderActions {
  /** Each action shows only when given: the user lacks the permission otherwise. */
  readonly onAdd?: (() => void) | undefined;
  readonly onLoginMethod?: (() => void) | undefined;
}

interface UsersHeaderProps {
  isRefreshing: boolean;
  /** Called on every change; the caller debounces. */
  onSearch: (keyword: string) => void;
  onRefresh: () => void;
  actions: UsersHeaderActions;
}

const SECTION = getOrganizationSection(OrganizationSection.Users);

/** v1 `UserManagementHeader.vue`: Search users, Login Method, New User, Refresh. */
export function UsersHeader({ isRefreshing, onSearch, onRefresh, actions }: UsersHeaderProps) {
  return (
    <PageHeader
      icon={SECTION.icon}
      title={SECTION.title}
      actions={
        <>
          <Input
            allowClear
            aria-label="Search users"
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            className="w-40 sm:w-60"
            onChange={event => onSearch(event.target.value)}
          />
          {actions.onLoginMethod && (
            <Button icon={<i className="di-icon-setting" />} onClick={actions.onLoginMethod}>
              <span className="hidden sm:inline">Login Method</span>
            </Button>
          )}
          <Button aria-label="Refresh" icon={<i className="di-icon-reset" />} loading={isRefreshing} onClick={onRefresh}>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {actions.onAdd && (
            <Button type="primary" icon={<PlusOutlined />} onClick={actions.onAdd}>
              New User
            </Button>
          )}
        </>
      }
    />
  );
}
