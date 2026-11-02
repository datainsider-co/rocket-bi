import { Breadcrumb } from 'antd';
import { Link } from 'react-router';
import type { Breadcrumb as Crumb } from '@/features/directory/directory.utils';

interface AnalysisTrailViewProps {
  name: string;
  crumbs: readonly Crumb[];
}

/** Where the analysis is saved (v1 breadcrumbs): My Data, its folders, then its name. */
export function AnalysisTrailView({ name, crumbs }: AnalysisTrailViewProps) {
  return (
    <Breadcrumb
      items={[
        { key: 'root', title: <Link to="/mydata">My Data</Link> },
        ...crumbs.map(crumb => ({ key: crumb.key, title: crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label })),
        { key: 'self', title: <span className="font-medium">{name}</span> }
      ]}
    />
  );
}
