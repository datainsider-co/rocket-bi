export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface TimePresetOptions {
  value: string;
  label: string;
  selected: boolean;
}

export interface CdpDateRange {
  from: number;
  to: number;
}
