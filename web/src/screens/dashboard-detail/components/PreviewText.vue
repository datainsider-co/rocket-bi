<template>
  <div class="preview-text-panel-container container-fluid px-0">
    <div class="preview-text-panel">
      <div class="preview-text-panel-left">
        <div class="mode-selector-container">
          <a-tabs class="mode-selector" :active-key="textWidget.isHtmlRender.toString()" @change="handleEditorModeChange(!textWidget.isHtmlRender)">
            <a-tab-pane key="false">
              <span slot="tab" class="d-flex align-items-center"> <i class="di-icon-text mar-r-12"></i> Text </span>
            </a-tab-pane>
            <a-tab-pane key="true">
              <span slot="tab" class="d-flex align-items-center"> <i class="di-icon-code mar-r-12"></i> HTML </span>
            </a-tab-pane>
          </a-tabs>
        </div>

        <div class="description">
          Enter the content to add below, and you can manipulate the text color, background, and size
        </div>
        <BFormTextarea
          ref="text"
          :placeholder="editorPlaceholder"
          type="text"
          class="text-editor form-control"
          id="inputText"
          :spellcheck="false"
          autocomplete="off"
          v-model="textWidget.content"
          autofocus
        />
      </div>
      <div class="preview-text-panel-separate" />
      <div class="preview-text-panel-right">
        <div class="mode-selector-container v2">
          <a-tabs class="mode-selector" value="review" default-active-key="review">
            <a-tab-pane class="ant-tabs-tab-active" key="review">
              <span slot="tab" class="d-flex align-items-center" style="color: var(--text-color); font-weight: 700">Review </span>
            </a-tab-pane>
            <a-tab-pane class="ant-tabs-tab-active" style="display: none;" key="aa">
              <span slot="tab" class="d-flex align-items-center"></span>
            </a-tab-pane>
          </a-tabs>
        </div>

        <div class="description">
          View the result here. You can edit the values of these properties to change the text color, background, and font size according to your preferences.
        </div>
        <div ref="dashboard" class="preview-text--dashboard">
          <WidgetContainer class="preview-text--dashboard--container" :widget="textWidget" :default-setting="defaultSetting">
            <TextViewer :style="{ height: reviewHeight }" ref="textViewer" :widget="textWidget" :width="reviewWidth"></TextViewer>
          </WidgetContainer>
        </div>
      </div>
    </div>
    <div class="editor-config">
      <div class="editor-config--row">
        <div class="editor-config--group">
          <div class="editor-config--group--title">
            Text
          </div>
          <div class="editor-config--group--configs">
            <div class="config-item">
              <!--            <CustomSelect :options="options" @change="handleFilterChanged" :selected="selected" />-->
              <DiDropdownV2
                class="font-family"
                :id="genDropdownId('add-text-font-family')"
                labelProps="displayName"
                valueProps="id"
                :value="textWidget.fontFamily"
                :data="fontFamilyOptions"
                @selected="option => textWidget.setFontFamily(option.id)"
              />
            </div>
            <div class="config-item">
              <DiDropdownV2
                class="font-size"
                :id="genDropdownId('add-text-font-size')"
                labelProps="displayName"
                valueProps="id"
                :value="textWidget.fontSize"
                :data="options"
                @selected="option => textWidget.setFontSize(option.id)"
              />
            </div>
            <div class="config-item">
              <FontStyleSetting title="" :isBold.sync="textWidget.isBold" :isUnderline.sync="textWidget.isUnderline" :isItalic.sync="textWidget.isItalic" />
            </div>
            <div class="config-item">
              <AlignSettingV2 title="" :setting-value="textAlign" @change="handleTextAlignChange"></AlignSettingV2>
            </div>
            <div class="config-item">
              <div class="input-group">
                <ColorPickerV2
                  :allowWatchValueChange="true"
                  class=""
                  :id="genBtnId('preview-text-color-picker')"
                  :default-color="emptyTextWidget.fontColor"
                  :value="textWidget.fontColor"
                  @change="value => textWidget.setFontColor(value)"
                />
              </div>
            </div>
            <div class="config-item">
              <PercentageInput ref="percentageInput" tooltip="Text opacity" :value="opacity.toString()" @input="handleOpacityChange"> </PercentageInput>
            </div>
          </div>
        </div>

        <!--        <div class="editor-config&#45;&#45;group">-->
        <!--          <div class="editor-config&#45;&#45;group&#45;&#45;title">-->
        <!--            Opacity-->
        <!--          </div>-->
        <!--          <div class="editor-config&#45;&#45;group&#45;&#45;configs">-->
        <!--            <div class="config-item">-->
        <!--              <PercentageInput ref="percentageInput" :value="opacity.toString()" @input="handleOpacityChange"> </PercentageInput>-->
        <!--            </div>-->
        <!--          </div>-->
        <!--        </div>-->
      </div>

      <div class="editor-config--group">
        <div class="editor-config--group--title" style="font-weight: 500">
          Background
        </div>
        <div class="editor-config--group--configs">
          <div class="config-item">
            <div class="input-group">
              <ColorPickerV2
                :allowWatchValueChange="true"
                class=""
                :id="genBtnId('preview-background-color-picker')"
                :default-color="emptyTextWidget.background"
                :value="textWidget.background"
                @change="value => textWidget.setBackground(value)"
              />
            </div>
          </div>
          <div class="config-item">
            <PercentageInput
              tooltip="Background opacity"
              ref="backgroundOpacityInput"
              :value="backgroundOpacity.toString()"
              @input="handleBackgroundOpacityChange"
            >
            </PercentageInput>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { TextWidget, TextAlign, WidgetSetting } from '@core/common/domain/model';
import { SelectOption } from '@/shared';
import { clone } from 'lodash';
import { Log } from '@core/utils';
import ColorSetting from '@/shared/settings/common/ColorSetting.vue';
import FontStyleSetting from '@/screens/dashboard-detail/components/font-style-setting/FontStyleSetting.vue';
import AlignSettingV2 from '@/screens/dashboard-detail/components/align-setting/AlignSettingV2.vue';
import ColorPickerV2 from '@/shared/components/ColorPickerV2.vue';
import DiButton from '@/shared/components/common/DiButton.vue';
import { BFormTextarea } from 'bootstrap-vue';
import PercentageInput from '@/shared/components/PercentageInput.vue';
import TextViewer from '@/screens/dashboard-detail/components/widget-container/other/TextViewer.vue';
import WidgetContainer from '@/screens/dashboard-detail/components/widget-container/WidgetContainer.vue';
import { DashboardModule } from '@/screens/dashboard-detail/stores';
import { FontFamilyOptions, PrimaryFontSizeOptions } from '@/shared/settings/common/options';
@Component({
  components: {
    DiButton,
    AlignSettingV2,
    FontStyleSetting,
    ColorSetting,
    ColorPickerV2,
    PercentageInput,
    TextViewer,
    WidgetContainer
  }
})
class PreviewText extends Vue {
  textWidget = TextWidget.empty();

  protected get emptyTextWidget() {
    return TextWidget.empty();
  }

  @Prop({ required: true, type: String })
  protected reviewWidth!: string;

  @Prop({ required: true, type: String })
  protected reviewHeight!: string;

  @Ref()
  protected readonly text!: BFormTextarea;

  @Ref()
  protected readonly textViewer!: TextViewer;

  @Ref()
  protected readonly dashboard!: HTMLDivElement;

  @Ref()
  percentageInput!: PercentageInput;
  @Ref()
  backgroundOpacityInput!: PercentageInput;

  protected get defaultSetting(): WidgetSetting {
    return DashboardModule.setting.widgetSetting;
  }

  readonly options: SelectOption[] = PrimaryFontSizeOptions;
  readonly fontFamilyOptions: SelectOption[] = FontFamilyOptions;

  protected get editorPlaceholder() {
    return this.textWidget.isHtmlRender ? 'Input code...' : 'Input text...';
  }

  protected get textAlign() {
    return this.textWidget.textAlign ?? TextAlign.Left;
  }

  protected get opacity() {
    return this.textWidget.opacity ?? 100;
  }

  protected get backgroundOpacity() {
    return this.textWidget.backgroundOpacity ?? 100;
  }

  public getReviewWidgetHeight() {
    return this.textViewer.textRender?.$el.clientHeight ?? this.textViewer.htmlRender?.clientHeight ?? 100;
  }

  init(textWidget: TextWidget) {
    this.$nextTick(() => {
      this.textWidget = clone(textWidget);
      this.percentageInput.setCurrentValue(this.opacity);
      this.backgroundOpacityInput.setCurrentValue(this.backgroundOpacity);
      this.initSyncScroll();
    });
  }

  initSyncScroll() {
    try {
      const textContainer = this.text.$el;
      const reviewContainer = this.dashboard;
      textContainer.addEventListener('scroll', this.initTextScrollEvent);
      reviewContainer.addEventListener('scroll', this.initReviewScrollEvent);
    } catch (e) {
      Log.error('PreviewText::initSyncScroll::error::', e);
    }
  }
  beforeDestroy() {
    Log.debug('PreviewText::beforeDestroy::');
    this.destroySyncScroll();
  }

  destroySyncScroll() {
    try {
      const textContainer = this.text.$el;
      const reviewContainer = this.dashboard;
      textContainer.removeEventListener('scroll', this.initTextScrollEvent);
      reviewContainer.removeEventListener('scroll', this.initReviewScrollEvent);
    } catch (e) {
      Log.error('PreviewText::initSyncScroll::error::', e);
    }
  }

  initTextScrollEvent(event: Event) {
    const textContainer = this.text.$el;
    const reviewContainer = this.dashboard;
    const textScrollTop = textContainer.scrollTop;
    const textMaxScrollTop = textContainer.scrollHeight - textContainer.clientHeight;
    const reviewMaxScrollTop = reviewContainer.scrollHeight - reviewContainer.clientHeight;
    const ratioTop = textScrollTop / textMaxScrollTop;
    const newScrollTop: number = Math.ceil(ratioTop * reviewMaxScrollTop);
    reviewContainer.scrollTo(0, newScrollTop);
  }

  initReviewScrollEvent(event: Event) {
    const textContainer = this.text.$el;
    const reviewContainer = this.dashboard;
    const reviewScrollTop = reviewContainer.scrollTop;
    const textMaxScrollTop = textContainer.scrollHeight - textContainer.clientHeight;
    const reviewMaxScrollTop = reviewContainer.scrollHeight - reviewContainer.clientHeight;
    const ratioTop = reviewScrollTop / reviewMaxScrollTop;
    const newScrollTop: number = Math.ceil(ratioTop * textMaxScrollTop);
    textContainer.scrollTo(0, newScrollTop);
  }

  protected handleOpacityChange(opacity: number) {
    if (isNaN(opacity)) {
      this.textWidget.setOpacity(100);
    } else {
      this.textWidget.setOpacity(opacity);
    }
    Log.debug('PreviewText::handleOpacityChange::opacity::', opacity);
  }

  protected handleBackgroundOpacityChange(opacity: number) {
    if (isNaN(opacity)) {
      this.textWidget.setBackgroundOpacity(100);
    } else {
      this.textWidget.setBackgroundOpacity(opacity);
    }
    Log.debug('PreviewText::handleBackgroundOpacityChange::opacity::', opacity);
  }

  protected handleEditorModeChange(isHtml: boolean) {
    this.textWidget.isHtmlRender = isHtml;
    this.destroySyncScroll();
    this.initSyncScroll();
  }

  protected handleTextAlignChange(align: TextAlign) {
    this.textWidget.setTextAlign(align);
  }
}

export default PreviewText;
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';
.preview-text-panel-container {
  .preview-text-button {
    width: fit-content;
    padding: 10px 14px 10px 10px;
    width: fit-content;
    border: 1px solid #e5e5e5 !important;
    height: 40px;
    border-radius: 6px;
    &:hover {
      background-color: #f0f0f0 !important;
    }
  }
  .editor-config {
    border: 1px solid #f0f0f0;
    padding: 21.6px 14px 22.4px;
    display: flex;
    flex-direction: column;
    margin-top: 17px;

    &--row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      &:not(:last-child) {
        margin-bottom: 16px;
      }
    }

    &--group {
      display: flex;
      flex-direction: column;
      &--title {
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 15.263px; /* 15.263px */
      }

      &--configs {
        display: flex;
        align-items: center;
        flex-wrap: wrap;

        .font-family {
          width: 161px;
        }
        .font-size {
          width: 100px;
        }
      }
    }

    .config-item {
      margin-top: 15px;
      margin-right: 8px;
      label {
        height: 16px;
      }

      .form-control {
        height: 30px;
        background: var(--secondary);
      }

      .input-group {
        border-radius: 4px;

        .btn-color-picker {
          background-color: var(--secondary);
        }
      }

      .color-component {
        border: 1px solid #f0f0f0;
        border-radius: 4px;
      }

      .select-container-v2 {
        margin-top: 0;
      }
    }
  }
  .preview-text-panel {
    min-height: 241px;
    display: flex;
    align-items: center;
    height: 400px;

    .ant-tabs-tab-active {
      color: #0066ff;
    }

    .ant-tabs-ink-bar {
      background-color: #0066ff;
    }
    .description {
      color: #8e8e93;
      padding-bottom: 24px;
      padding-top: 16px;

      font-family: Roboto;
      font-size: 14px;
      font-style: normal;
      font-weight: 400;
      line-height: 19.6px; /* 19.6px */
    }

    .mode-selector-container {
      margin-top: 5px;
      height: 46px;
      .mode-selector {
        height: 46px;
        margin-bottom: 16px;
        width: fit-content;
        .ant-tabs-nav .ant-tabs-tab {
          padding: 12px 0;
        }
      }
    }
    .mode-selector-container.v2 {
      .ant-tabs-nav {
        //  transition: 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        //
        .ant-tabs-ink-bar {
          width: 44px !important;
        }
        .ant-tabs-tab {
          margin: 0;
        }
      }
    }

    &-left {
      width: 50%;
      height: 100%;
      background: var(--secondary);
      border-radius: 4px;

      display: flex;
      flex-direction: column;

      .text-editor {
        height: 270px;
        padding: 12px;

        &::placeholder {
          margin-top: 5px;
        }
      }
    }

    &-right {
      width: 50%;
      background: var(--secondary);
      height: 100%;

      border-radius: 4px;

      display: flex;
      flex-direction: column;

      .preview-text--dashboard {
        height: 270px;
        padding: 16px;
        background: var(--primary);
        overflow: auto;

        .preview-text--dashboard--container {
          height: fit-content;
          min-height: 100px;

          .text-widget-container {
            display: flex;
            align-items: center;
          }
        }
      }
    }

    &-separate {
      margin-right: 11px;
    }

    .modal-header {
      padding-bottom: 0;
    }
  }
}
</style>
