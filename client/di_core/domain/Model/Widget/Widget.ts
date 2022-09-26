import {
  ChartInfo,
  DateFilter,
  DynamicFilter,
  DynamicFunctionWidget,
  ImageWidget,
  LinkWidget,
  TabWidget,
  TextWidget,
  WidgetId,
  Widgets,
  DynamicConditionWidget
} from '@core/domain/Model';
import { ClassNotFound } from '@core/domain/Exception/ClassNotFound';
import { WidgetExtraData } from '@core/domain/Model/Widget/WidgetExtraData';
import { WidgetCommonData } from '@core/domain/Model/Widget/WidgetCommonData';

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
        return DynamicFilter.fromObject(obj);
      case Widgets.Tab:
        return TabWidget.fromObject(obj);
      case Widgets.DynamicFunctionWidget:
        return DynamicFunctionWidget.fromObject(obj);
      case Widgets.DynamicConditionWidget:
        return DynamicConditionWidget.fromObject(obj);
      default:
        throw new ClassNotFound(`fromObject: object with className ${obj.className} not found`);
    }
  }

  /**
   * @deprecated: Feature not support in v3
   */
  static getChartFamilyType(widget: Widget): string {
    return '';
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
}
