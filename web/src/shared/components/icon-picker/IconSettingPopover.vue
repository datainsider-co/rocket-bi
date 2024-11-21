<template>
  <BPopover ref="iconPickerPopover" :show.sync="isShowIconPicker" custom-class="icon-setting-popover" placement="bottomRight" :target="targetId">
    <div class="icon-picker-container" v-click-outside="iconPickerVcoConfig()" ref="iconPickerContainer">
      <DiTab class="icon-picker-container--tab" :defaultActiveIndex="0" :tabs="tabs">
        <slot :slot="IconPickerTab.Icon">
          <IconPicker
            ref="iconPicker"
            :selected-icon="selectedIcon"
            :selected-icon-color="selectedIconColor"
            @selectIcon="handleSelectIcon"
            @selectIconColor="handleSelectIconColor"
          ></IconPicker>
        </slot>
        <slot :slot="IconPickerTab.Border">
          <IconBorderSetting
            ref="iconBorderSetting"
            :border-color="borderColor"
            :border-radius="borderRadius"
            :background="background"
            @changeIconBackground="handleSelectIconBackground"
            @changeBorderColor="handleSelectBorderColor"
            @changeBorderRadius="handleSelectBorderRadius"
          />
        </slot>
      </DiTab>
      <DiButton class="restore-default-button" border title="Revert to default" @click.stop="handleRevertToDefault">
        <i class="di-icon-restore"></i>
      </DiButton>
    </div>
  </BPopover>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator';
import DiTab, { DiTabData } from '@/shared/components/DiTab.vue';
import DiSearchInput from '@/shared/components/DiSearchInput.vue';
import { AllIcons, IconBackgroundColors, IconBorders, IconColors } from '@/shared/components/icon-picker/IconConstant';
import ColorPicker from '@/shared/components/ColorPicker.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import IconPicker from '@/shared/components/icon-picker/IconPicker.vue';
import IconBorderSetting from '@/shared/components/icon-picker/IconBorderSetting.vue';
import { Log } from '@core/utils';

export enum IconPickerTab {
  Icon = 'icon',
  Border = 'border'
}

@Component({
  components: { IconBorderSetting, IconPicker, ColorPicker, DiSearchInput, DiTab, PopoverV2 }
})
export default class IconSettingPopover extends Vue {
  private isShowIconPicker = false;

  @Prop({ required: true, type: String })
  targetId!: string;

  @Prop()
  selectedIcon?: string;

  @Prop()
  selectedIconColor?: string;
  @Prop()
  borderRadius?: string;

  @Prop()
  borderColor?: string;

  @Prop()
  background?: string;

  @Ref()
  iconPickerContainer?: HTMLElement;

  @Ref()
  iconPicker?: IconPicker;

  @Ref()
  iconBorderSetting?: IconBorderSetting;

  private readonly IconPickerTab = IconPickerTab;
  private readonly tabs: DiTabData[] = [
    {
      key: IconPickerTab.Icon,
      label: 'Icon',
      click: () => {
        this.selectedTab = IconPickerTab.Icon;
      }
    },
    {
      key: IconPickerTab.Border,
      label: 'Custom Shape Border',
      click: () => {
        this.selectedTab = IconPickerTab.Border;
      }
    }
  ];
  private selectedTab: IconPickerTab = IconPickerTab.Icon;

  private iconPickerVcoConfig() {
    return {
      handler: (e: Event) => this.handler(e, this.hidePopover),
      middleware: this.iconPickerMiddleware,
      events: ['click']
    };
  }

  private handler(event: any, hidePopover: () => void) {
    const elements = this.iconPicker?.colorPickerContainer ? [this.iconPicker.colorPickerContainer] : [];
    if (this.iconPickerContainer) {
      elements.push(this.iconPickerContainer);
    }
    if (this.iconPicker?.colorPicker?.popoverContainer) {
      elements.push(this.iconPicker?.colorPicker.popoverContainer);
    }
    if (this.iconBorderSetting?.borderColorPicker?.popoverContainer) {
      elements.push(this.iconBorderSetting.borderColorPicker.popoverContainer);
    }
    if (!elements.some(element => element.contains(event.target))) {
      hidePopover();
    }
  }

  private iconPickerMiddleware(event: any) {
    return event.target.className !== 'icon-picker-container';
  }

  private get iconColor() {
    return this.selectedIconColor;
  }

  private hidePopover() {
    this.isShowIconPicker = false;
  }

  private handleSelectIcon(iconClass: string) {
    this.$emit('selectIcon', iconClass);
  }
  private handleSelectIconColor(iconClass: string) {
    this.$emit('selectIconColor', iconClass);
  }

  private handleSelectIconBackground(color: string) {
    this.$emit('changeIconBackground', color);
  }

  private handleSelectBorderColor(color: string) {
    this.$emit('changeBorderColor', color);
  }

  private handleSelectBorderRadius(value: string) {
    Log.debug('IconSettingPopover::handleSelectBorderRadius::value::', value);
    this.$emit('changeBorderRadius', value);
  }

  private handleRevertToDefault() {
    try {
      this.$emit('revertDefault');
      this.hidePopover();
    } catch (e) {
      Log.error('IconSettingPopover::handleRevertToDefault::error::', e);
    }
  }
}
</script>

<style lang="scss">
.icon-setting-popover {
  background: none;
  border: none;
  margin-top: 0 !important;
  //min-height: 428px;
  max-width: unset;
  padding: 0 !important;
  box-shadow: 0px -1px 5px 0px rgba(0, 0, 0, 0.08), 0px 4px 4px 0px rgba(0, 0, 0, 0.08);
  .arrow {
    display: none;
  }
  .popover-body {
    border-radius: 4px;

    width: unset;
    height: unset;
    padding: 0;
    background: var(--secondary);
    .icon-picker-container {
      width: 674px;
      height: 428px;
      padding: 19px 32px 19px 35px;
      position: relative;
      overflow: hidden;
      &--tab {
        .ant-tabs-ink-bar {
          min-width: 51px;
          background: #11152d;
        }
        .di-tab--content {
          min-width: 51px;
          color: #11152d;
        }
        .ant-tabs-tab {
          padding: 11px 0;
        }

        .ant-tabs-bar {
          margin-bottom: 24px;
        }
      }

      .restore-default-button {
        position: absolute;
        top: 22px;
        right: 34.5px;

        height: 40px;
        .title {
          font-weight: 400;
          font-size: 14px;
          color: #11152d;
        }
        i {
          color: #000000;
        }
      }
    }
  }
}
</style>
