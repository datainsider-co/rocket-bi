import { TextAlign } from '@core/common/domain';

export interface StyleSettings {
  background?: string;
  fontSize?: string;
  fontFamily?: string;
  fontColor?: string;
  textAlign?: TextAlign;
  opacity?: number;
  backgroundOpacity?: number;
  isItalic?: boolean;
  isBold?: boolean;
  isUnderline?: boolean;
}
