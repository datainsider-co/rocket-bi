import { ApplyToType, ColorRules, ColorScale, ConditionalFormattingType, Field, FunctionType } from '@core/common/domain';

export interface ColorFormatting {
  enabled: boolean;
  formatType: ConditionalFormattingType;
  applyTo: ApplyToType;
  baseOnField?: Field;
  summarization?: FunctionType;
  scale?: ColorScale;
  rules?: ColorRules;
}
