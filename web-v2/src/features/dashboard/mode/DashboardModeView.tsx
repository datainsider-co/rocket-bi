import { DesktopOutlined, EllipsisOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { DashboardMode } from './dashboardMode.utils';

interface DashboardModeViewProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
}

/**
 * The header's Options menu in view mode (v1 `DashboardControlBar`: Full screen, TV mode), and the button that leaves
 * either. Share, View As and Relationship come with their own features.
 */
export function DashboardModeView({ mode, onChange }: DashboardModeViewProps) {
  if (mode !== DashboardMode.View) {
    return <Button type="text" icon={<FullscreenExitOutlined />} aria-label="Exit full screen" onClick={() => onChange(DashboardMode.View)} />;
  }
  const items = [
    { key: DashboardMode.FullScreen, label: 'Full screen', icon: <FullscreenOutlined />, onClick: () => onChange(DashboardMode.FullScreen) },
    { key: DashboardMode.Tv, label: 'TV mode', icon: <DesktopOutlined />, onClick: () => onChange(DashboardMode.Tv) }
  ];
  return (
    <Dropdown trigger={['click']} menu={{ items }} placement="bottomRight">
      <Button type="text" icon={<EllipsisOutlined />} aria-label="Options" />
    </Dropdown>
  );
}
