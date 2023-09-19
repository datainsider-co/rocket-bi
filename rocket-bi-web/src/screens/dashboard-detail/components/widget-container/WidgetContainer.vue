<template>
  <div
    class="di-widget-container"
    :style="widgetStyle"
    :class="{
      'di-widget-container--no-shadow': isHideShadow
    }"
  >
    <div class="di-widget-container--body">
      <slot></slot>
    </div>
    <div class="di-widget-container--action-bar">
      <slot name="action-bar"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import Vue from 'vue';
import { Prop } from 'vue-property-decorator';
import { ChartOption, Widget, WidgetSetting } from '@core/common/domain';
import { ColorUtils, StringUtils } from '@/utils';

@Component
export default class WidgetContainer extends Vue {
  @Prop({ required: true, type: Object })
  protected readonly widget!: Widget;

  @Prop({ required: true, type: Object })
  protected readonly defaultSetting!: WidgetSetting;

  @Prop({ required: false, type: Boolean, default: false })
  protected readonly isHideShadow!: boolean;

  protected get widgetStyle(): any {
    return {
      '--widget-background-color': this.getWidgetBackgroundColor(),
      '--widget-border-radius': this.defaultSetting.border.radius.toCssStyle(),
      '--widget-border-radius-top-left': StringUtils.toPx(this.defaultSetting.border.radius.topLeft),
      '--widget-border-radius-top-right': StringUtils.toPx(this.defaultSetting.border.radius.topRight),
      '--widget-border-radius-bottom-left': StringUtils.toPx(this.defaultSetting.border.radius.bottomLeft),
      '--widget-border-radius-bottom-right': StringUtils.toPx(this.defaultSetting.border.radius.bottomRight),
      '--widget-padding': this.widget.getOverridePadding() ?? this.defaultSetting.toPaddingCss(),
      '--widget-border-width': this.defaultSetting.border.toWidthCss(),
      '--widget-border-color': this.defaultSetting.border.toColorCss(),
      // primary text
      '--text-color': this.defaultSetting.primaryText.toColorCss(),
      '--widget-primary-font-family': this.defaultSetting.primaryText.fontFamily,
      '--widget-primary-font-size': this.defaultSetting.primaryText.fontSize,
      '--widget-primary-font-weight': this.defaultSetting.primaryText.toFontWeightCss(),
      '--widget-primary-font-style': this.defaultSetting.primaryText.toFontStyleCss(),
      '--widget-primary-font-underlined': this.defaultSetting.primaryText.toFontUnderlinedCss(),
      '--widget-primary-font-align': this.defaultSetting.primaryText.textAlign,
      // secondary text
      '--secondary-text-color': this.defaultSetting.secondaryText.toColorCss(),
      '--widget-secondary-font-family': this.defaultSetting.secondaryText.fontFamily,
      '--widget-secondary-font-size': this.defaultSetting.secondaryText.fontSize,
      '--widget-secondary-font-weight': this.defaultSetting.secondaryText.toFontWeightCss(),
      '--widget-secondary-font-style': this.defaultSetting.secondaryText.toFontStyleCss(),
      '--widget-secondary-font-underlined': this.defaultSetting.secondaryText.toFontUnderlinedCss(),
      '--widget-secondary-font-align': this.defaultSetting.secondaryText.textAlign
    };
  }

  private getWidgetBackgroundColor(): string {
    const widgetBgColor = this.widget.getBackgroundColor();
    if (!widgetBgColor || widgetBgColor === ChartOption.getThemeBackgroundColor()) {
      return this.defaultSetting.background.toColorCss();
    } else {
      const opacity = this.widget.getBackgroundColorOpacity();
      return ColorUtils.withAlpha(widgetBgColor, opacity);
    }
  }
}
</script>

<style lang="scss">
$widget-box-shadow: 0px 2px 4px 0px #0000001a;
$widget-background-color: var(--widget-background-color, #fff);
$widget-border-radius: var(--widget-border-radius, 20px);
$widget-padding: var(--widget-padding, 15px);
$widget-border-width: var(--widget-border-width, 1px);
$widget-border-color: var(--widget-border-color, #e5e5e5);

.di-widget-container {
  position: relative;
  height: 100%;
  background: transparent;

  &:before {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    content: '';
    background-color: $widget-background-color;
    border-radius: $widget-border-radius;
    box-shadow: $widget-box-shadow;
    outline: $widget-border-width solid $widget-border-color;
  }

  &.di-widget-container--no-shadow {
    &:before {
      box-shadow: none;
    }
  }

  &--body {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    padding: $widget-padding;
    border-radius: $widget-border-radius;
    overflow: hidden;
  }

  &--action-bar {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 3;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
