<template>
  <div class="icon-picker-container--tab--border">
    <div class="icon-picker-container--tab--border--title">
      Shape
    </div>
    <div class="icon-picker-container--tab--border--shape">
      <div
        :data-tile="borderInfo.displayName"
        v-for="(borderInfo, borderIndex) in iconBorders"
        :key="'icon-border-' + borderIndex"
        :class="{ active: borderInfo.radiusValue === borderRadius }"
        class="icon-picker-container--tab--border--shape--item"
        @click="handleChangeBorderRadius(borderInfo.radiusValue)"
      >
        <span :style="{ borderRadius: borderInfo.radiusValue, borderColor: borderColor, background: background }"></span>
      </div>
    </div>
    <div class="icon-picker-container--tab--border--title">
      Shape Background
    </div>
    <div class="icon-picker-container--tab--border--background">
      <div
        v-for="bgColor in iconBackgroundColors"
        :key="'bg-color-' + bgColor.color"
        class="icon-picker-container--tab--border--background--color-item"
        :class="{ active: bgColor.color === background }"
        @click="handleBgChange(bgColor.color)"
      >
        <div :style="{ background: bgColor.color, border: bgColor.border }" class="icon-picker-container--tab--border--background--color-item--point"></div>
      </div>
    </div>
    <!--    <div class="icon-picker-container&#45;&#45;tab&#45;&#45;border&#45;&#45;title">-->
    <!--      Shape border-->
    <!--    </div>-->
    <!--    <ColorPicker-->
    <!--      ref="borderColorPicker"-->
    <!--      id="border-color"-->
    <!--      :value="borderColor"-->
    <!--      class="icon-picker-container&#45;&#45;tab&#45;&#45;border&#45;&#45;custom-color"-->
    <!--      default-color="var(&#45;&#45;text-color)"-->
    <!--      @change="handleChangeBorderColor"-->
    <!--    />-->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { IconBackgroundColors, IconBorders } from '@/shared/components/icon-picker/IconConstant';
import ColorPicker from '@/shared/components/ColorPicker.vue';

@Component
export default class IconBorderSetting extends Vue {
  private readonly iconBackgroundColors = IconBackgroundColors;
  private readonly iconBorders = IconBorders;

  @Prop()
  borderRadius?: string;

  @Prop()
  borderColor?: string;

  @Prop()
  background?: string;

  @Ref()
  borderColorPicker?: ColorPicker;

  private handleBgChange(color: string) {
    this.$emit('changeIconBackground', color);
  }

  private handleChangeBorderColor(color: string) {
    this.$emit('changeBorderColor', color);
  }

  private handleChangeBorderRadius(value: string) {
    this.$emit('changeBorderRadius', value);
  }
}
</script>

<style lang="scss">
.icon-picker-container--tab--border {
  &--title {
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 15.263px;
    text-align: left;
  }
  &--shape {
    display: flex;
    align-items: center;
    gap: 21px;
    margin-top: 10px;
    margin-bottom: 15px;
    .active {
      border: 1px solid var(--accent);
    }

    &--item {
      cursor: pointer;
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;

      span {
        width: 48px;
        height: 48px;
        border-style: solid;
      }
      &:hover {
        background: #f0f0f0;
      }
    }
  }

  &--background {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-wrap: wrap;
    margin-top: 14px;
    margin-bottom: 19px;

    .active {
      border: 1px solid var(--accent);
    }

    &--color-item {
      border-radius: 4px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;

      &--point {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        box-shadow: 0 0 0 1px #d6d6d6;
      }
      &:hover {
        background: #f0f0f0;
      }
    }
  }

  &--custom-color {
    margin-top: 18px;
    border: 1px solid #c4cdd5;
    width: 146px;
    border-radius: 4px;
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
</style>
