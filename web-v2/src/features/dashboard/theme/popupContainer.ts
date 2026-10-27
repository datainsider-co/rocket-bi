/**
 * Where the header's popovers render: inside the dashboard page, so they take its theme's CSS variables (scoped to the
 * page, see `dashboardTheme.css`) and stay above it in full screen. Outside a page, the document body.
 */
export function inDashboardPage(trigger: HTMLElement): HTMLElement {
  return trigger.closest<HTMLElement>('.dashboard-page') ?? document.body;
}

/** Where the dashboard's dialogs render, for the same reason: the open dashboard page, else the document body. */
export function dashboardPageContainer(): HTMLElement {
  return document.querySelector<HTMLElement>('.dashboard-page') ?? document.body;
}
