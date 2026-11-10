interface EmptyDashboardViewProps {
  /** Offers "Click here to add your first chart" when given. */
  onAddChart?: () => void;
}

/** v1 `EmptyDashboard.vue`: what a dashboard without widgets shows in its content box. */
export function EmptyDashboardView({ onAddChart }: EmptyDashboardViewProps) {
  return (
    <div className="dashboard-empty">
      <img className="dashboard-empty__icon" src="/icons/ic_empty_dashboard.svg" alt="" />
      <div className="dashboard-empty__text">
        Your dashboard is empty
        {onAddChart && (
          <>
            <br />
            <button type="button" className="dashboard-empty__link" onClick={onAddChart}>
              Click here
            </button>{' '}
            to add your first chart
          </>
        )}
      </div>
    </div>
  );
}
