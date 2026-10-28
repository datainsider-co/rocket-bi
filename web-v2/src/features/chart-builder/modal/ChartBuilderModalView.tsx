import { useState, type ReactNode } from 'react';
import { Button, Modal, Typography } from 'antd';
import type { BuilderMode } from '../host/builderSession.utils';

type Tab = 'builder' | 'settings';

export interface BuilderActions {
  mode: BuilderMode;
  /** v1: nothing to save until the zones build a chart, nor while its preview fails. */
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export interface BuilderSlots {
  types: ReactNode;
  tree: ReactNode;
  panel: ReactNode;
  settings: ReactNode;
  preview: ReactNode;
}

const TABS: readonly { key: Tab; label: string; icon: string }[] = [
  { key: 'builder', label: 'Builder', icon: 'di-icon-config' },
  { key: 'settings', label: 'Settings', icon: 'di-icon-tool' }
];

/**
 * The builder (v1 `ChartBuilderModal` + `ChartBuilderController`): Builder and Settings tabs on the left, Cancel and
 * Add / Update on top, the field tree and the zones, and the preview. Rendered in place rather than in a portal, so
 * the dashboard's theme variables reach the preview.
 */
interface ChartBuilderModalViewProps {
  actions: BuilderActions;
  slots: BuilderSlots;
  /** The chart card's background, from its viz options. */
  previewBackground: string;
}

export function ChartBuilderModalView({ actions, slots, previewBackground }: ChartBuilderModalViewProps) {
  const [tab, setTab] = useState<Tab>('builder');
  return (
    <Modal
      open
      centered
      footer={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      getContainer={false}
      width="min(1400px, calc(100vw - 32px))"
      styles={{ body: { height: 'min(735px, calc(100vh - 100px))' } }}
    >
      <div className="flex h-full">
        <nav className="flex w-20 shrink-0 flex-col gap-1 border-0 border-r border-solid border-black/10 pr-3" aria-label="Builder tabs">
          {TABS.map(item => (
            <button
              key={item.key}
              type="button"
              aria-pressed={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`flex cursor-pointer flex-col items-center gap-1 rounded border-0 px-2 py-2 text-xs ${tab === item.key ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]' : 'bg-transparent text-inherit hover:bg-black/5'}`}
            >
              <i className={`${item.icon} text-lg`} aria-hidden />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-1 flex-col pl-4">
          <header className="flex items-center gap-2 pb-3">
            <Typography.Title level={4} className="m-0!">
              Chart Builder
            </Typography.Title>
            <Button className="ml-auto" onClick={actions.onCancel}>
              Cancel
            </Button>
            <Button type="primary" disabled={!actions.canSave} loading={actions.saving} onClick={actions.onSave}>
              {actions.mode === 'add' ? 'Add' : 'Update'}
            </Button>
          </header>
          <div className="flex min-h-0 flex-1 gap-4">
            {tab === 'builder' ? (
              <>
                <div className="w-60 shrink-0">{slots.tree}</div>
                <div className="flex w-80 shrink-0 flex-col gap-4 overflow-auto pr-1">
                  {slots.types}
                  {slots.panel}
                </div>
              </>
            ) : (
              <div className="w-[36rem] shrink-0 overflow-auto pr-1">{slots.settings}</div>
            )}
            <div className="min-w-0 flex-1 rounded border border-solid border-black/10 p-3" style={{ background: previewBackground }}>
              {slots.preview}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
