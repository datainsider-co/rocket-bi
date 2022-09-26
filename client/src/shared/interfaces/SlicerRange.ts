export interface SlicerRange {
  from: SlicerValue;
  to: SlicerValue;
}

export interface SlicerValue {
  value: number | string;
  equal: boolean;
}
