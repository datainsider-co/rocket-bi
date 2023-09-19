<template>
  <div class="icon-picker-container--tab--icon">
    <div class="icon-picker-container--tab--icon--header">
      <DiSearchInput
        class="icon-picker-container--tab--icon--header--filter"
        :value="keyword"
        placeholder="Filter..."
        @change="handleKeywordChanged"
      ></DiSearchInput>
      <img src="@/assets/icon/random.svg" class="icon-picker-container--tab--icon--header--shuffle di-icon-click" @click="handleShuffleIcon" />
      <div id="pick-color-button" class="icon-picker-container--tab--icon--header--color">
        <div :style="{ background: iconColor }" class="icon-picker-container--tab--icon--header--color--point"></div>
      </div>
    </div>
    <vuescroll :ops="scrollOps" class="icon-picker-container--tab--icon--icons">
      <div :style="{ height: `${iconPickerHeight}` }">
        <div v-for="(group, groupIndex) in allIcons" :key="'group-icon-' + groupIndex" class="icon-picker-container--tab--icon--icons--group">
          <div class="icon-picker-container--tab--icon--icons--group--title">
            {{ group.groupName }}
          </div>
          <div class="icon-picker-container--tab--icon--icons--group--icon-items">
            <div
              class="icon-picker-container--tab--icon--icons--group--icon-items--item"
              v-for="(iconInfo, index) in group.icons"
              :style="{ backgroundColor: iconBackground }"
              :key="'icon-' + index"
              :title="iconInfo.iconClass"
              :class="[iconInfo.iconClass === selectedIcon ? 'active' : '']"
            >
              <i :style="{ color: iconColor }" :class="[iconInfo.iconClass]" @click="handleSelectIcon(iconInfo.iconClass)"></i>
            </div>
          </div>
        </div>
      </div>
    </vuescroll>
    <BPopover :show.sync="isShowColorPicker" target="pick-color-button" placement="bottomLeft" custom-class="color-picker-popover">
      <div ref="colorPickerContainer" v-click-outside="colorPickerVcoConfig()" class="color-picker-container">
        <div class="color-picker--listing">
          <div
            v-for="iconColor in iconColors"
            :key="'icon-color-' + iconColor.color"
            class="color-picker--listing--color-item"
            :class="{ active: selectedIconColor === iconColor.color }"
            @click.stop="handleSelectIconColor(iconColor.color)"
          >
            <div :style="{ background: iconColor.color, border: iconColor.border }" class="color-picker--listing--color-item--point"></div>
          </div>
        </div>
        <div class="color-picker-container--custom-color">
          <div class="color-picker-container--custom-color--title">Color Code</div>
          <ColorPicker
            ref="colorPicker"
            id="icon-picker-custom-color-picker"
            @click.stop
            class="color-picker-container--custom-color--picker"
            :value="selectedIconColor"
            default-color="#fff"
            @change="color => handleSelectIconColor(color)"
          />
        </div>
      </div>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { IconInfo } from '@/shared/components/icon-picker/IconInfo';
import { AllIcons, IconColors } from '@/shared/components/icon-picker/IconConstant';
import { lowerCase } from 'lodash';
import { RandomUtils, ListUtils } from '@/utils';
import { VerticalScrollConfigs } from '@/shared';
import ColorPicker from '@/shared/components/ColorPicker.vue';
import { Log } from '@core/utils';
import { DataManager } from '@core/common/services';

@Component
export default class IconPicker extends Vue {
  private isShowColorPicker = false;
  private keyword = '';
  private readonly iconColors = IconColors;
  private readonly scrollOps = VerticalScrollConfigs;

  @Prop({ type: String, default: () => '277px' })
  iconPickerHeight?: string;

  @Prop()
  selectedIcon?: string;

  @Prop()
  selectedIconColor?: string;

  @Prop()
  borderRadius?: string;

  @Prop()
  borderColor?: string;

  @Ref()
  colorPickerContainer?: HTMLElement;

  @Ref()
  colorPicker?: ColorPicker;

  @Ref()
  iconBorderSetting?: ColorPicker;

  mounted() {
    this.setRecentIcons();
  }

  private get iconColor() {
    return this.selectedIconColor;
  }

  private get borderCSS() {
    return this.iconColor?.toLowerCase() === '#fff' || this.iconColor?.toLowerCase() === '#ffffff' ? '0.5px solid #F0F0F0' : '';
  }

  private get iconBackground() {
    return this.iconColor === '#fff' || this.iconColor?.toLowerCase() === '#ffffff' ? '#11152D' : 'transparent';
  }

  private setRecentIcons() {
    const recentIcon: string[] = DataManager.getRecentIcons();
    const newRecentIcons: IconInfo[] = [];
    recentIcon.forEach(iconClass => {
      newRecentIcons.push({ iconClass: iconClass, displayName: iconClass });
    });
    AllIcons[0].icons = newRecentIcons;
  }

  private get allIcons(): { groupName: string; icons: IconInfo[] }[] {
    if (this.keyword) {
      const allIcons = AllIcons.map(group => {
        const icons = group.icons.filter(iconInfo => iconInfo.displayName.includes(lowerCase(this.keyword.trim())));
        return {
          groupName: group.groupName,
          icons: icons
        };
      });
      return allIcons.filter(item => !ListUtils.isEmpty(item.icons));
    } else {
      return AllIcons.filter(item => !ListUtils.isEmpty(item.icons));
    }
  }

  private colorPickerVcoConfig() {
    return {
      handler: (e: Event) => this.colorPickerHandler(e, this.hideColorPickerPopover),
      middleware: this.colorPickerMiddleware,
      events: ['click']
    };
  }

  private colorPickerHandler(event: any, hidePopover: () => void) {
    const elements = this.colorPickerContainer ? [this.colorPickerContainer] : [];
    if (this.colorPicker?.popoverContainer) {
      elements.push(this.colorPicker.popoverContainer);
    }
    if (!elements.some(element => element.contains(event.target))) {
      hidePopover();
      Log.debug('colorPickerHandler::');
    }
  }

  private colorPickerMiddleware(event: any) {
    return event.target.className !== 'color-picker-container';
  }

  private handleKeywordChanged(value: string) {
    this.keyword = value;
  }

  private randomIcon() {
    const allIconInfo: IconInfo[] = AllIcons.flatMap(group => group.icons);
    const randomIndex = RandomUtils.nextInt(0, allIconInfo.length);
    return allIconInfo[randomIndex].iconClass;
  }

  private handleShuffleIcon() {
    const iconClass = this.randomIcon();
    this.handleSelectIcon(iconClass);
  }

  private handleSelectIcon(iconClass: string) {
    this.$emit('selectIcon', iconClass);

    this.saveRecentIcons(iconClass);
    this.setRecentIcons();
  }

  private saveRecentIcons(iconClass: string) {
    const setRecentIcons = new Set(AllIcons[0].icons.map(icon => icon.iconClass));
    setRecentIcons.add(iconClass);
    DataManager.saveRecentIcons(Array.from(setRecentIcons));
  }

  private handleSelectIconColor(color: string) {
    this.$emit('selectIconColor', color);
    this.hideColorPickerPopover();
  }

  private hideColorPickerPopover() {
    this.isShowColorPicker = false;
  }
}
</script>

<style lang="scss">
.icon-picker-container--tab--icon {
  &--header {
    display: flex;
    align-items: center;
    &--filter {
      border-radius: 4px;
      border: 1px solid var(--sky-basic, #c4cdd5);
      background: var(--theme-and-text-line-f-0-f-0-f-0, #f0f0f0);
      height: 40px;
      width: 519px;
    }
    &--shuffle {
      border-radius: 4px;
      margin-right: 4px;
      margin-left: 13px;
      width: 37px;
      height: 37px;
      cursor: pointer;
      &:hover {
        background: #f0f0f0;
      }
    }

    &--color {
      border-radius: 4px;
      position: relative;
      padding: 4px;
      width: 38px;
      height: 38px;
      cursor: pointer;

      &--point {
        position: absolute;
        display: flex;
        align-items: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        margin: 0 auto;
        box-shadow: 0 0 0 1px #d6d6d6;
      }
      &:hover {
        background: #f0f0f0;
      }
    }
  }

  &--icons {
    margin-top: 6px;
    //height: 277px !important;
    &--group {
      &--title {
        margin-top: 18px;
        color: #4f4f4f;
        font-family: Roboto;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 15.263px;
        margin-bottom: 12px;
        text-align: left;
      }
      &--icon-items {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        .active {
          border: 1px solid var(--accent);
          //width: 30px !important;
          //height: 30px !important;
        }
        &--item {
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          &:hover {
            background: #f0f0f0 !important;
          }
          i {
            font-size: 24px;
          }
        }
      }
    }
  }
}

.color-picker-popover {
  background: none;
  border: none;
  margin-top: 0 !important;
  max-width: unset;
  padding: 0 !important;
  box-shadow: 0px -1px 5px 0px rgba(0, 0, 0, 0.08), 0px 4px 4px 0px rgba(0, 0, 0, 0.08);
  .arrow {
    display: none;
  }
  .popover-body {
    width: unset;
    height: unset;
    padding: 0;
    background: var(--secondary);
    border-radius: 4px;
    .color-picker-container {
      padding: 23px 17px 20px 20px;
      width: 225px;
      height: 202px;

      &--custom-color {
        margin-top: 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;

        &--title {
          font-size: 12px;
          font-style: normal;
          font-weight: 400;
          line-height: 13.083px;
        }

        &--picker {
          border-radius: 4px;
          width: 109px;
          border: 1px solid #c4cdd5;

          input {
            background: none;
            padding-left: 15px;
          }
          .input-group-append {
            > div {
              background: none;
            }
          }
        }
      }

      .color-picker--listing {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 7px;
        .active {
          border: 1px solid var(--accent);
        }
        &--color-item {
          border-radius: 4px;
          width: 32px;
          height: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          &--point {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            box-shadow: 0 0 0 1px #d6d6d6;
          }
          &:hover {
            background: #f0f0f0;
          }
        }
      }
    }
  }
}
</style>
