import { ValueColorFormatting } from '@core/domain/Model/ChartOption/ExtraSetting/ConditionFormatting/ValueColorFormatting';
import { DefaultValueColorFormatting } from '@core/domain/Model/ChartOption/ExtraSetting/ConditionFormatting/DefaultValueColorFormatting';

export interface ColorScale {
  min?: ValueColorFormatting;
  center?: ValueColorFormatting;
  max?: ValueColorFormatting;
  default?: DefaultValueColorFormatting;
}
