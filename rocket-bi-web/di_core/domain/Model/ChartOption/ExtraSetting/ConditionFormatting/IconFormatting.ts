/*
 * @author: tvc12 - Thien Vi
 * @created: 7/23/21, 11:24 AM
 */

import { ApplyToType, ConditionalFormattingType, Field, FunctionType, IconRules } from '@core/domain';

export type IconLayout = 'left' | 'right' | 'only_icon';

export type IconAlign = 'top' | 'center' | 'bottom';

export enum IconStyle {
  Default = 'default',
  Style1 = 'style_1',
  Style2 = 'style_2',
  Style3 = 'style_3',
  Style4 = 'style_4',
  Style5 = 'style_5'
}

export interface IconFormatting {
  enabled: boolean;
  formatType: ConditionalFormattingType;
  applyTo: ApplyToType;
  baseOnField?: Field;
  summarization?: FunctionType;
  rules?: IconRules;
  layout?: IconLayout;
  align?: IconAlign;
  style?: IconStyle;
}
