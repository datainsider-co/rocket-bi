import { BorderInfo } from './Border';
import { TextStyleSetting } from './TextStyleSetting';
import { BackgroundInfo } from './BackgroundInfo';
import { StringUtils } from '@/utils';

export class WidgetSetting {
  primaryText: TextStyleSetting;
  secondaryText: TextStyleSetting;

  // in px
  padding: number;

  border: BorderInfo;
  background: BackgroundInfo;

  constructor(data: { primaryText?: TextStyleSetting; secondaryText?: TextStyleSetting; padding?: number; border?: BorderInfo; background?: BackgroundInfo }) {
    this.primaryText = data.primaryText ?? TextStyleSetting.primaryDefault();
    this.secondaryText = data.secondaryText ?? TextStyleSetting.secondaryDefault();
    this.padding = data.padding ?? 15;
    this.border = data.border ?? BorderInfo.none();
    this.background = data.background ?? BackgroundInfo.widgetDefault();
  }

  static default(): WidgetSetting {
    return new WidgetSetting({
      primaryText: TextStyleSetting.primaryDefault(),
      secondaryText: TextStyleSetting.secondaryDefault(),
      padding: 15,
      border: BorderInfo.none(),
      background: BackgroundInfo.widgetDefault()
    });
  }

  static fromObject(obj: any): WidgetSetting {
    return new WidgetSetting({
      primaryText: TextStyleSetting.fromObject(obj.primaryText),
      secondaryText: TextStyleSetting.fromObject(obj.secondaryText),
      padding: obj.padding,
      border: BorderInfo.fromObject(obj.border),
      background: BackgroundInfo.fromObject(obj.background)
    });
  }

  toPaddingCss(): string {
    return StringUtils.toPx(this.padding);
  }
}
