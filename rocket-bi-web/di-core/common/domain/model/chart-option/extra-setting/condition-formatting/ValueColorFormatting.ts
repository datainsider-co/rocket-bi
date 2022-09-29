import { ValueColorFormattingType } from '@core/common/domain/model/chart-option/extra-setting/condition-formatting/ValueColorFormattingType';

export interface ValueColorFormatting {
  enabled?: boolean;
  type?: ValueColorFormattingType;
  color?: string;
  value?: string;
}
