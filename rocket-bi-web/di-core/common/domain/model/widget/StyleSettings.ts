import { TextStyle } from '@/screens/dashboard-detail/components/text-style-setting/TextStyle';
import { TextAlign } from '@/screens/dashboard-detail/components/align-setting/TextAlign';

export interface StyleSettings {
  background?: string;
  fontSize?: string;
  fontFamily?: string;
  fontColor?: string;
  textStyle?: TextStyle;
  textAlign?: TextAlign;
  opacity?: number;
  backgroundOpacity?: number;
}
