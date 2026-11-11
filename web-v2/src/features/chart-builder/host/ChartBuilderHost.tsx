import { Modal } from 'antd';
import type { ChartBuilderHostProps } from '@/features/dashboard/edit/chartBuilderBridge';
import { ViewAsProvider } from '@/features/dashboard/view-as/ViewAsContext';
import { Loading } from '@/shared/status/Loading';
import { ChartBuilderModal } from '../modal/ChartBuilderModal';
import { ChartTypePickerModal } from '../picker/ChartTypePickerModal';
import { BuilderProvider } from '../state/BuilderContext';
import { BuilderScope } from '../theme/BuilderScope';
import { useBuilderSession } from './useBuilderSession';

/**
 * ChartBuilder on a dashboard (v1 `ChartBuilderComponent`): the type picker for a new chart, then the builder, in the
 * builder's own look (`BuilderScope`). The preview queries as the viewer, never as a View As user.
 */
export function ChartBuilderHost({ request, dashboard, editor, onClose }: ChartBuilderHostProps) {
  const session = useBuilderSession(request, dashboard);
  if (session.picker) {
    return (
      <BuilderScope>
        <ChartTypePickerModal items={session.picker} onPick={session.pick} onCancel={onClose} />
      </BuilderScope>
    );
  }
  if (session.loading) {
    return (
      <BuilderScope>
        <Modal open centered footer={null} closable={false} getContainer={false} width={160}>
          <Loading />
        </Modal>
      </BuilderScope>
    );
  }
  return (
    <BuilderScope>
      <BuilderProvider start={session.start} controls={session.controls} sqlQueryOf={session.sqlQueryOf} dashboardId={dashboard.id}>
        <ViewAsProvider>
          <ChartBuilderModal request={request} dashboard={dashboard} editor={editor} adhocTable={session.adhocTable} onClose={onClose} />
        </ViewAsProvider>
      </BuilderProvider>
    </BuilderScope>
  );
}
