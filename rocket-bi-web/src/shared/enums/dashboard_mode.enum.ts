export enum DashboardMode {
  None = -1,
  View = 0,
  ViewFullScreen = 1,
  Edit = 2,
  EditFullScreen = 3,
  TVMode = 4,
  RLSViewAsMode = 5
}

export const isFullScreen = (mode: DashboardMode) => mode == DashboardMode.ViewFullScreen || mode == DashboardMode.EditFullScreen;
export const isEdit = (mode: DashboardMode) => mode == DashboardMode.Edit || mode == DashboardMode.EditFullScreen;
export const isView = (mode: DashboardMode) => mode == DashboardMode.View || mode == DashboardMode.ViewFullScreen;
export const isTVMode = (mode: DashboardMode) => mode == DashboardMode.TVMode;
export const isRLSViewAsMode = (mode: DashboardMode) => mode == DashboardMode.RLSViewAsMode;
