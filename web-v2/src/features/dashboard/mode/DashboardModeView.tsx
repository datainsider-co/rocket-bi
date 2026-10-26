import { DesktopOutlined, EllipsisOutlined, EyeOutlined, FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { DashboardMode } from './dashboardMode.utils';

interface DashboardModeViewProps {
  mode: DashboardMode;
  onChange: (mode: DashboardMode) => void;
  /** Offers View As when given. */
  onViewAs?: () => void;
}

/**
 * The header's Options menu in view mode (v1 `DashboardControlBar`: Full screen, TV mode, View As), and the button that
 * leaves full screen. Share and Relationship come with their own features.
 */
export function DashboardModeView({ mode, onChange, onViewAs }: DashboardModeViewProps) {
  if (mode !== DashboardMode.View) {
    return <Button type="text" icon={<FullscreenExitOutlined />} aria-label="Exit full screen" onClick={() => onChange(DashboardMode.View)} />;
  }
  const items = [
    { key: DashboardMode.FullScreen, label: 'Full screen', icon: <FullscreenOutlined />, onClick: () => onChange(DashboardMode.FullScreen) },
    { key: DashboardMode.Tv, label: 'TV mode', icon: <DesktopOutlined />, onClick: () => onChange(DashboardMode.Tv) },
    ...(onViewAs ? [{ key: 'view-as', label: 'View As', icon: <EyeOutlined />, onClick: onViewAs }] : [])
  ];
  return (
    <Dropdown trigger={['click']} menu={{ items }} placement="bottomRight">
      <Button type="text" icon={<EllipsisOutlined />} aria-label="Options" />
    </Dropdown>
  );
}
