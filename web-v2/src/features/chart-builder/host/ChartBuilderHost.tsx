import { Modal, Spin } from 'antd';
import type { ChartBuilderHostProps } from '@/features/dashboard/edit/chartBuilderBridge';
import { ViewAsProvider } from '@/features/dashboard/view-as/ViewAsContext';
import { ChartBuilderModal } from '../modal/ChartBuilderModal';
import { ChartTypePickerModal } from '../picker/ChartTypePickerModal';
import { BuilderProvider } from '../state/BuilderContext';
import { useBuilderSession } from './useBuilderSession';

/**
 * ChartBuilder on a dashboard (v1 `ChartBuilderComponent`): the type picker for a new chart, then the builder. The
 * preview queries as the viewer, never as a View As user.
 */
export function ChartBuilderHost({ request, dashboard, editor, onClose }: ChartBuilderHostProps) {
  const session = useBuilderSession(request, dashboard);
  if (session.picker) return <ChartTypePickerModal items={session.picker} onPick={session.pick} onCancel={onClose} />;
  if (session.loading) {
    return (
      <Modal open centered footer={null} closable={false} width={160}>
        <Spin className="flex! justify-center" />
      </Modal>
    );
  }
  return (
    <BuilderProvider start={session.start} controls={session.controls} sqlQueryOf={session.sqlQueryOf} dashboardId={dashboard.id}>
      <ViewAsProvider>
        <ChartBuilderModal request={request} dashboard={dashboard} editor={editor} adhocTable={session.adhocTable} onClose={onClose} />
      </ViewAsProvider>
    </BuilderProvider>
  );
}
