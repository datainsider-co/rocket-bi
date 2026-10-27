import type { ReactNode } from 'react';
import './DashboardHeader.css';

interface DashboardHeaderViewProps {
  title: string;
  /** Back is offered when given. */
  onBack?: () => void;
  /** The pencil after the title, in edit mode. */
  onRename?: () => void;
  /** The right side: main date, Reset Filters and the mode's buttons. */
  children: ReactNode;
}

/** v1 `DashboardHeader`: back chevron, the dashboard's name (with rename while editing), then the control bar. */
export function DashboardHeaderView({ title, onBack, onRename, children }: DashboardHeaderViewProps) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__bar">
        <div className="dashboard-header__left">
          {onBack && (
            <button type="button" className="dashboard-header__icon-button dashboard-header__back" aria-label="Back" onClick={onBack}>
              <i className="di-icon-arrow-left-large" aria-hidden />
            </button>
          )}
          <h4 className="dashboard-header__title" title={title}>
            {title}
          </h4>
          {onRename && (
            <button type="button" className="dashboard-header__icon-button dashboard-header__rename" aria-label="Rename dashboard" onClick={onRename}>
              <i className="di-icon-inline-edit" aria-hidden />
            </button>
          )}
        </div>
        <div className="dashboard-header__right">{children}</div>
      </div>
    </header>
  );
}
