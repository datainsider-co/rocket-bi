import { Layout, Menu } from 'antd';
import { Link } from 'react-router';
import type { OrganizationSection, OrganizationSectionConfig } from '../organization.utils';

interface OrganizationSidebarProps {
  sections: readonly OrganizationSectionConfig[];
  active: OrganizationSection | undefined;
}

/** v1 `OrganizationSettings.vue`'s `LayoutSidebar`: the sections the user may open. Collapses below `md`. */
export function OrganizationSidebar({ sections, active }: OrganizationSidebarProps) {
  return (
    <Layout.Sider breakpoint="md" collapsedWidth={0} width={220} theme="light" className="!bg-transparent">
      <nav aria-label="Organization Settings" className="pr-4">
        <Menu
          mode="inline"
          className="!border-e-0 !bg-transparent"
          selectedKeys={active ? [active] : []}
          items={sections.map(section => ({
            key: section.key,
            icon: <i className={section.icon} />,
            label: <Link to={section.path}>{section.title}</Link>
          }))}
        />
      </nav>
    </Layout.Sider>
  );
}
