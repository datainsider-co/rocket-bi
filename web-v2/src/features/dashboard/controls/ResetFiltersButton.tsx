import { UndoOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useDashboardControls } from './DashboardControlsContext';

/** Shown once a filter or cross filter left its default (v1 `DashboardControlBar` "Reset Filters"). */
export function ResetFiltersButton() {
  const { changed, reset } = useDashboardControls();
  if (!changed) return null;
  return (
    <Button type="text" icon={<UndoOutlined />} onClick={reset}>
      Reset Filters
    </Button>
  );
}
