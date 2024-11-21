export interface GridSetting {
  vertical?: VerticalGridSetting;
  horizontal?: HorizontalGridSetting;
}

export interface VerticalGridSetting {
  color?: string;
  thickness?: string;
  applyHeader?: boolean;
  applyBody?: boolean;
  applyTotal?: boolean;
}
export interface HorizontalGridSetting {
  color?: string;
  thickness?: string;
  rowPadding?: string;

  applyHeader?: boolean;
  applyBody?: boolean;
  applyTotal?: boolean;
}
