import { NumberUtils } from '@core/utils';

export enum FunnelItemShowMode {
  None = '',
  DropOff = 'dropoff',
  Conversion = 'conversion'
}

export class FunnelAnalysisItem {
  static readonly FILL_HEIGHT = 120;

  eventName: string;
  finalTotal: number;
  value: number;
  mode: FunnelItemShowMode;
  previousValue: number | null;
  nextValue: number | null;
  avgDateFromPrev: number | null;
  isLoading: boolean;

  constructor(
    isLoading: boolean,
    eventName: string,
    finalTotal: number,
    value: number,
    mode: FunnelItemShowMode,
    previousValue?: number | null,
    nextValue?: number | null,
    avgDateFromPrev?: number | null
  ) {
    this.isLoading = isLoading;
    this.eventName = eventName;
    this.value = value;
    this.previousValue = previousValue ?? null;
    this.nextValue = nextValue ?? null;
    this.avgDateFromPrev = avgDateFromPrev ?? null;
    this.finalTotal = finalTotal;
    this.mode = mode;
  }

  static showDropOff(
    isLoading: boolean,
    eventName: string,
    finalTotal: number,
    value: number,
    previousValue?: number | null,
    nextValue?: number | null,
    avgDateFromPrev?: number | null
  ) {
    return new FunnelAnalysisItem(isLoading, eventName, finalTotal, value, FunnelItemShowMode.DropOff, previousValue, nextValue, avgDateFromPrev);
  }

  static showConversion(
    isLoading: boolean,
    eventName: string,
    finalTotal: number,
    value: number,
    previousValue?: number | null,
    nextValue?: number | null,
    avgDateFromPrev?: number | null
  ) {
    return new FunnelAnalysisItem(isLoading, eventName, finalTotal, value, FunnelItemShowMode.Conversion, previousValue, nextValue, avgDateFromPrev);
  }

  get dropOff(): number {
    return this.value - (this.nextValue ?? 0);
  }

  get dropOffRate(): number {
    return NumberUtils.round((this.dropOff / this.value) * 100);
  }

  get conversionRate(): number {
    return NumberUtils.round((this.value / this.finalTotal) * 100);
  }

  get totalHeight(): number {
    return Math.floor((this.value / this.finalTotal) * FunnelAnalysisItem.FILL_HEIGHT);
  }

  get dropOffHeight(): number {
    return Math.floor((this.dropOff / this.finalTotal) * FunnelAnalysisItem.FILL_HEIGHT);
  }
}
