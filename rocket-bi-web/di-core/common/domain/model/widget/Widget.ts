import { ChartInfo, DateFilter, InternalFilter, ImageWidget, LinkWidget, TabWidget, TextWidget, WidgetId, Widgets, Position } from '@core/common/domain/model';
import { ClassNotFound } from '@core/common/domain/exception/ClassNotFound';
import { WidgetExtraData } from '@core/common/domain/model/widget/WidgetExtraData';
import { WidgetCommonData } from '@core/common/domain/model/widget/WidgetCommonData';

export abstract class Widget implements WidgetCommonData {
  abstract className: Widgets;

  id: WidgetId;
  name: string;
  description: string;
  backgroundColor?: string;
  extraData?: WidgetExtraData;
  textColor?: string;

  constructor(commonSetting: WidgetCommonData) {
    this.id = commonSetting.id;
    this.name = commonSetting.name;
    this.description = commonSetting.description;
    this.backgroundColor = commonSetting.backgroundColor;
    this.extraData = commonSetting.extraData;
    this.textColor = commonSetting.textColor;
  }

  static fromObject(obj: any): Widget {
    switch (obj.className) {
      case Widgets.DateFilter:
        return DateFilter.fromObject(obj);
      case Widgets.Text:
        return TextWidget.fromObject(obj);
      case Widgets.Link:
        return LinkWidget.fromObject(obj);
      case Widgets.Image:
        return ImageWidget.fromObject(obj);
      case Widgets.Chart:
        return ChartInfo.fromObject(obj);
      case Widgets.DynamicFilter:
        return InternalFilter.fromObject(obj);
      case Widgets.Tab:
        return TabWidget.fromObject(obj);
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }

  /**
   * @deprecated: Feature not support in v3
   */
  static getChartType(widget: Widget): string {
    return '';
  }

  setTitle(title: string): void {
    this.name = title;
  }

  /**
   * @return [0, 100]
   */
  getBackgroundColorOpacity(): number {
    return 100;
  }

  getBackgroundColor(): string | undefined {
    return this.backgroundColor;
  }

  getOverridePadding(): string | undefined {
    return void 0;
  }

  abstract getDefaultPosition(): Position;
}
