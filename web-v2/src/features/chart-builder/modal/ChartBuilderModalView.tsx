import { useState, type ReactNode } from 'react';
import { Button, Modal } from 'antd';
import type { BuilderMode } from '../host/builderSession.utils';
import './ChartBuilderModal.css';

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
  /** None where the chart type is fixed (Data Cook's Transform and Pivot). */
  types?: ReactNode;
  tree: ReactNode;
  panel: ReactNode;
  /** None hides the Builder and Settings tabs. */
  settings?: ReactNode;
  preview: ReactNode;
}

const TABS: readonly { key: Tab; label: string; icon: string }[] = [
  { key: 'builder', label: 'Builder', icon: 'di-icon-config' },
  { key: 'settings', label: 'Settings', icon: 'di-icon-tool' }
];

/**
 * The builder (v1 `ChartBuilderModal` + `ChartBuilderController`): Builder and Settings on the left rail, Cancel and
 * Add / Update on top, then the field tree and the zones (or the settings) and the preview under "Visualization".
 * Rendered in place rather than in a portal, inside `BuilderScope`.
 */
interface ChartBuilderModalViewProps {
  actions: BuilderActions;
  slots: BuilderSlots;
  /** v1's "Chart Builder" by default. */
  title?: string;
}

export function ChartBuilderModalView({ actions, slots, title = 'Chart Builder' }: ChartBuilderModalViewProps) {
  const [tab, setTab] = useState<Tab>('builder');
  const hasSettings = slots.settings !== undefined;
  return (
    <Modal
      open
      centered
      className="chart-builder-modal"
      footer={null}
      closable={false}
      mask={{ closable: false }}
      keyboard={false}
      getContainer={false}
      width="min(1400px, calc(100vw - 32px))"
    >
      <div className="chart-builder">
        {hasSettings && (
          <nav className="chart-builder__bar" aria-label="Builder tabs">
            {TABS.map(item => (
              <button key={item.key} type="button" className="chart-builder__bar-item" aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>
                <i className={item.icon} aria-hidden />
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <div className="chart-builder__main">
          <header className="chart-builder__header">
            <h3 className="chart-builder__title">{title}</h3>
            <div className="chart-builder__buttons">
              <Button onClick={actions.onCancel}>Cancel</Button>
              <Button type="primary" disabled={!actions.canSave} loading={actions.saving} onClick={actions.onSave}>
                {actions.mode === 'add' ? 'Add' : 'Update'}
              </Button>
            </div>
          </header>
          <div className="chart-builder__body">
            <div className="chart-builder__config">
              {tab === 'builder' ? (
                <>
                  <div className="chart-builder__panel chart-builder__panel--tree">{slots.tree}</div>
                  <div className="chart-builder__panel chart-builder__panel--zones">
                    {slots.types && <div className="chart-builder__types">{slots.types}</div>}
                    <div className="chart-builder__zones">{slots.panel}</div>
                  </div>
                </>
              ) : (
                <div className="chart-builder__panel chart-builder__panel--settings">{slots.settings}</div>
              )}
            </div>
            <section className="chart-builder__viz" aria-label="Visualization">
              <div className="chart-builder__viz-title">Visualization</div>
              <div className="chart-builder__viz-body">{slots.preview}</div>
            </section>
          </div>
        </div>
      </div>
    </Modal>
  );
}
