import { Button, Layout, Menu } from 'antd';
import { Link } from 'react-router';
import { DATA_COOK_SECTIONS, type DataCookSection } from '../dataCook.utils';

interface DataCookSidebarProps {
  active: DataCookSection;
  onNewEtl: () => void;
}

/** v1 `DataCook.vue`'s `LayoutSidebar`: "New ETL" and the section links. Collapses below `md`. */
export function DataCookSidebar({ active, onNewEtl }: DataCookSidebarProps) {
  return (
    <Layout.Sider breakpoint="md" collapsedWidth={0} width={220} theme="light" className="!bg-transparent">
      <div className="pr-4">
        <Button type="primary" size="large" icon={<i className="di-icon-add" />} className="mb-4" onClick={onNewEtl}>
          New ETL
        </Button>
        <nav aria-label="Data Cook">
          <Menu
            mode="inline"
            className="!border-e-0 !bg-transparent"
            selectedKeys={[active]}
            items={DATA_COOK_SECTIONS.map(section => ({
              key: section.key,
              icon: <i className={section.icon} />,
              label: <Link to={section.path}>{section.title}</Link>
            }))}
          />
        </nav>
      </div>
    </Layout.Sider>
  );
}
