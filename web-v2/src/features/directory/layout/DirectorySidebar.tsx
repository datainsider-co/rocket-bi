import { Button, Dropdown, Layout, Menu } from 'antd';
import { Link } from 'react-router';
import { SECTIONS } from '../directory.utils';
import type { DirectorySection } from '../directory.utils';
import type { CreateKind } from './useCreateItem';

interface DirectorySidebarProps {
  active: DirectorySection;
  onCreate: (kind: CreateKind) => void;
}

const CREATE_ITEMS = [
  { key: 'folder', label: 'Folder', icon: <i className="di-icon-add-folder" /> },
  { key: 'dashboard', label: 'Dashboard', icon: <i className="di-icon-dashboard" /> }
];

/** v1 `LayoutSidebar` of the directory screen: `New` menu and the section links. Collapses below `md`. */
export function DirectorySidebar({ active, onCreate }: DirectorySidebarProps) {
  return (
    <Layout.Sider breakpoint="md" collapsedWidth={0} width={220} theme="light" className="!bg-transparent">
      <div className="pr-4">
        <Dropdown
          trigger={['click']}
          menu={{ items: CREATE_ITEMS, onClick: ({ key }) => onCreate(key as CreateKind) }}
        >
          <Button type="primary" size="large" icon={<i className="di-icon-add" />} className="mb-4">
            New
          </Button>
        </Dropdown>
        <nav aria-label="Directory">
          <Menu
            mode="inline"
            className="!border-e-0 !bg-transparent"
            selectedKeys={[active]}
            items={SECTIONS.map(section => ({
              key: section.key,
              icon: <i className={section.icon} />,
              label: <Link to={section.path}>{section.navLabel}</Link>
            }))}
          />
        </nav>
      </div>
    </Layout.Sider>
  );
}
