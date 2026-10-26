import type { ReactNode } from 'react';
import type { WidgetSetting } from '@/core/dashboard/DashboardSetting';
import type { Widget } from '@/core/dashboard/Widget';
import { widgetCssVars } from './widgetStyle.utils';
import './WidgetContainer.css';

interface WidgetContainerProps {
  widget: Widget;
  defaults: WidgetSetting;
  hideShadow?: boolean;
  /** Buttons in the top right corner (filters, more actions). */
  actions?: ReactNode;
  children: ReactNode;
}

/** The card every widget sits on (v1 `WidgetContainer.vue`). */
export function WidgetContainer({ widget, defaults, hideShadow = false, actions, children }: WidgetContainerProps) {
  return (
    <div
      className={`widget-container${hideShadow ? ' widget-container--no-shadow' : ''}`}
      style={widgetCssVars(widget, defaults)}
      data-widget-id={widget.id}
    >
      <div className="widget-container__body">{children}</div>
      {actions && <div className="widget-container__actions">{actions}</div>}
    </div>
  );
}
