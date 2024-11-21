/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

import { ChartOption, Position, StyleSettings, TextAlign, WidgetCommonData, Widgets } from '@core/common/domain/model';
import { Widget } from '../Widget';
import { get, set } from 'lodash';
import { Log } from '@core/utils';

export class TextWidget extends Widget {
  className = Widgets.Text;
  content: string;
  isHtmlRender: boolean;

  constructor(commonSetting: WidgetCommonData, content: string, isHtmlRender: boolean) {
    super(commonSetting);
    this.content = content;
    this.isHtmlRender = isHtmlRender;
  }

  getRenderStyle(): Record<string, any> {
    return {
      color: this.fontColor,
      fontSize: this.fontSize,
      textAlign: this.textAlign,
      fontFamily: this.fontFamily,
      opacity: this.opacity / 100,
      fontWeight: this.isBold ? 'bold' : '',
      fontStyle: this.isItalic ? 'italic' : '',
      textDecoration: this.isUnderline ? 'underline' : ''
    };
  }

  static empty() {
    return new TextWidget(
      {
        id: -1,
        name: '',
        description: '',
        textColor: ChartOption.getPrimaryTextColor(),
        backgroundColor: ChartOption.getThemeBackgroundColor(),
        extraData: {
          currentChartType: Widgets.Text,
          styleSettings: TextWidget.defaultStyleSettings()
        }
      },
      '',

      false
    );
  }

  get opacity(): number {
    return get(this, 'extraData.styleSettings.opacity', 100);
  }

  setOpacity(value: number) {
    set(this, 'extraData.styleSettings.opacity', value);
  }

  get backgroundOpacity(): number {
    return get(this, 'extraData.styleSettings.backgroundOpacity', 100);
  }

  setBackgroundOpacity(value: number) {
    set(this, 'extraData.styleSettings.backgroundOpacity', value);
  }

  getBackgroundColorOpacity(): number {
    return this.backgroundOpacity;
  }

  getBackgroundColor(): string | undefined {
    return this.background;
  }

  get fontSize(): string {
    return get(this, 'extraData.styleSettings.fontSize', '13px');
  }

  setFontSize(value: string) {
    set(this, 'extraData.styleSettings.fontSize', value);
  }

  get fontFamily(): string {
    return get(this, 'extraData.styleSettings.fontFamily', 'Roboto');
  }

  setFontFamily(value: string) {
    set(this, 'extraData.styleSettings.fontFamily', value);
  }

  get background(): string {
    return get(this, 'extraData.styleSettings.background', '#fff');
  }

  setBackground(value: string) {
    set(this, 'extraData.styleSettings.background', value);
  }

  get isItalic(): boolean {
    return get(this, 'extraData.styleSettings.isItalic', false);
  }

  set isItalic(value: boolean) {
    set(this, 'extraData.styleSettings.isItalic', value);
  }

  get isBold(): boolean {
    return get(this, 'extraData.styleSettings.isBold', false);
  }

  set isBold(value: boolean) {
    set(this, 'extraData.styleSettings.isBold', value);
  }

  get isUnderline(): boolean {
    return get(this, 'extraData.styleSettings.isUnderline', false);
  }

  set isUnderline(value: boolean) {
    set(this, 'extraData.styleSettings.isUnderline', value);
  }

  get fontColor(): string {
    return get(this, 'extraData.styleSettings.fontColor', 'var(--text-color)');
  }

  setFontColor(value: string) {
    Log.debug('TextWidget::setFontColor::value::', this);

    set(this, 'extraData.styleSettings.fontColor', value);
  }

  get textAlign(): TextAlign {
    return get(this, 'extraData.styleSettings.textAlign', TextAlign.Left);
  }

  setTextAlign(value: TextAlign) {
    Log.debug('TextWidget::setTextAlign::value::', this);

    set(this, 'extraData.styleSettings.textAlign', value);
  }

  static fromObject(obj: TextWidget): TextWidget {
    Log.debug('TextWidget::fromObject::obj::', obj);
    const extraData = obj.extraData ?? { currentChartType: Widgets.Text };
    if (!extraData.styleSettings) {
      extraData.styleSettings = TextWidget.defaultStyleSettings();
    }
    //migrate from previous text widget version
    if (obj.backgroundColor && !extraData.styleSettings.background) {
      extraData.styleSettings.background = obj.backgroundColor;
    }
    if (obj.textColor && !extraData.styleSettings.fontColor) {
      extraData.styleSettings.fontColor = obj.textColor;
    }
    if (obj.fontSize && !extraData.styleSettings.fontSize) {
      extraData.styleSettings.fontSize = obj.fontSize;
    }
    Log.debug('TextWidget::fromObject::obj::extraData', extraData);

    return new TextWidget({ ...obj, extraData: extraData }, obj.content, obj.isHtmlRender);
  }

  getDefaultPosition(): Position {
    return new Position(-1, -1, 8, 3, 1);
  }

  static defaultStyleSettings(): StyleSettings {
    return {
      background: ChartOption.getThemeBackgroundColor(),
      fontColor: ChartOption.getPrimaryTextColor(),
      fontSize: '12px',
      fontFamily: ChartOption.getPrimaryFontFamily(),
      textAlign: ChartOption.getPrimaryFontAlign() as TextAlign,
      opacity: 100,
      backgroundOpacity: 100,
      isItalic: false,
      isBold: false,
      isUnderline: false
    };
  }
}
