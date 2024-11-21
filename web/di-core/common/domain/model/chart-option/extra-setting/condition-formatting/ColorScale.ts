import { ValueColorFormatting } from '@core/common/domain/model/chart-option/extra-setting/condition-formatting/ValueColorFormatting';
import { DefaultValueColorFormatting } from '@core/common/domain/model/chart-option/extra-setting/condition-formatting/DefaultValueColorFormatting';

export interface ColorScale {
  min?: ValueColorFormatting;
  center?: ValueColorFormatting;
  max?: ValueColorFormatting;
  default?: DefaultValueColorFormatting;
}
