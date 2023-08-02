/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:04 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 12/17/20, 11:51 AM
 */

import { Position, StyleSettings, WidgetCommonData, Widgets } from '@core/common/domain/model';
import { Widget } from '../Widget';
import { TextStyle } from '@/screens/dashboard-detail/components/text-style-setting/TextStyle';
import { TextAlign } from '@/screens/dashboard-detail/components/align-setting/TextAlign';
import { get, set } from 'lodash';
import base = Mocha.reporters.base;
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

  getContainerStyle() {
    return {
      backgroundColor: this.background,
      opacity: this.getOpacityCSSValue(this.backgroundOpacity)
    };
  }

  getRenderStyle() {
    const style: Record<string, any> = {
      color: this.fontColor,
      fontSize: this.fontSize,
      textAlign: this.textAlign,
      fontFamily: this.fontFamily,
      opacity: this.getOpacityCSSValue(this.opacity)
    };
    switch (this.textStyle) {
      case TextStyle.Bold:
        style['fontWeight'] = 'bold';
        break;
      case TextStyle.Underline:
        style['textDecoration'] = 'underline';
        break;
      case TextStyle.Italic:
        style['fontStyle'] = 'italic';
        break;
    }
    return style;
  }

  static empty() {
    return new TextWidget(
      {
        id: -1,
        name: '',
        description: '',
        textColor: 'var(--text-color)',
        backgroundColor: 'var(--chart-background-color)',
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

  getOpacityCSSValue(opacity: number) {
    return opacity ? opacity / 100 : 1;
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

  get textStyle(): string {
    return get(this, 'extraData.styleSettings.textStyle', TextStyle.Normal);
  }

  setTextStyle(value: TextStyle) {
    set(this, 'extraData.styleSettings.textStyle', value);
  }

  get fontColor(): string {
    return get(this, 'extraData.styleSettings.fontColor', 'var(--text-color)');
  }

  setFontColor(value: string) {
    Log.debug('TextWidget::setFontColor::value::', this);

    set(this, 'extraData.styleSettings.fontColor', value);
  }

  get textAlign(): string {
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
      background: '#fff',
      fontColor: 'var(--text-color)',
      fontSize: '12px',
      fontFamily: 'Roboto',
      textStyle: TextStyle.Normal,
      textAlign: TextAlign.Left,
      opacity: 100,
      backgroundOpacity: 100
    };
  }
}
