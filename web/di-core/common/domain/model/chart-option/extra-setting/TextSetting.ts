import { StyleSetting } from '@core/common/domain/model';

export interface TextSetting {
  text?: string;
  style?: StyleSetting;
  align?: AlignSetting;
  backgroundColor?: string;
  isWordWrap?: boolean;
  enabled: boolean;
  verticalAlign?: string;
}
