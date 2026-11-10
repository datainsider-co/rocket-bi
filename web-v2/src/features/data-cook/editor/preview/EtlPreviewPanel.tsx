import { ExclamationCircleFilled, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ReactNode } from 'react';
import { Button, Tabs, Tooltip } from 'antd';
import type { PreviewTab, TablePreviewStatus } from './etlPreview.utils';

interface EtlPreviewPanelProps {
  tabs: readonly PreviewTab[];
  shown: string | undefined;
  onShow: (tblName: string) => void;
  onRefresh: () => void;
  /** The shown table's rows or message. */
  children: ReactNode;
}

function statusIcon(status: TablePreviewStatus) {
  if (status === 'loading') return <LoadingOutlined className="!mr-1.5" />;
  if (status === 'error') return <ExclamationCircleFilled className="!mr-1.5 text-[var(--ant-color-error)]" />;
  return null;
}

/** Below the canvas (v1 `etl-preview-header` and `etl-preview-content`): a tab per table, the shown one's rows. */
export function EtlPreviewPanel({ tabs, shown, onShow, onRefresh, children }: EtlPreviewPanelProps) {
  return (
    <section className="flex h-[42%] min-h-[240px] flex-col rounded-lg bg-white px-4 pb-2" aria-label="Preview">
      <Tabs
        size="small"
        activeKey={shown}
        onChange={onShow}
        items={tabs.map(tab => ({
          key: tab.tblName,
          label: (
            <span className="inline-block max-w-[250px] truncate align-bottom" title={tab.label}>
              {statusIcon(tab.status)}
              {tab.label}
            </span>
          )
        }))}
        tabBarExtraContent={
          <Tooltip title="Build every table again">
            <Button type="text" size="small" icon={<ReloadOutlined />} aria-label="Refresh preview" onClick={onRefresh} />
          </Tooltip>
        }
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
    </section>
  );
}
