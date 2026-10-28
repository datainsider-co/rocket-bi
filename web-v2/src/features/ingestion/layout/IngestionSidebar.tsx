import { Layout, Menu } from 'antd';
import { Link } from 'react-router';
import { INGESTION_SECTIONS, type IngestionSection } from '../ingestion.utils';

interface IngestionSidebarProps {
  active: IngestionSection;
}

/** v1 `DataIngestion.vue`'s `LayoutSidebar`: the section links. Collapses below `md`, like the directory sidebar. */
export function IngestionSidebar({ active }: IngestionSidebarProps) {
  return (
    <Layout.Sider breakpoint="md" collapsedWidth={0} width={220} theme="light" className="!bg-transparent">
      <nav aria-label="Data Ingestion" className="pr-4">
        <Menu
          mode="inline"
          className="!border-e-0 !bg-transparent"
          selectedKeys={[active]}
          items={INGESTION_SECTIONS.map(section => ({
            key: section.key,
            icon: <i className={section.icon} />,
            label: <Link to={section.path}>{section.title}</Link>
          }))}
        />
      </nav>
    </Layout.Sider>
  );
}
