import { ValueColorFormattingType } from '@core/domain/Model/ChartOption/ExtraSetting/ConditionFormatting/ValueColorFormattingType';

export interface ValueColorFormatting {
  enabled?: boolean;
  type?: ValueColorFormattingType;
  color?: string;
  value?: string;
}
