import { StyleSetting } from '@core/domain/Model';

export interface TextSetting {
  text?: string;
  style?: StyleSetting;
  align?: AlignSetting;
  backgroundColor?: string;
  isWordWrap?: boolean;
  enabled: boolean;
}
