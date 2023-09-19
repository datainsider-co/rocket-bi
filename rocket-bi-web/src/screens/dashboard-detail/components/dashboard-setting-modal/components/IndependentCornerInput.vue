<template>
  <div class="independent-corner">
    <div class="independent-corner--label">Independent Corner</div>
    <div class="independent-corner--input">
      <div
        class="independent-corner--input--preview"
        :style="{
          transform: `rotate(${rotateDeg})`
        }"
      >
        <img src="@/assets/icon/corner-rounded.svg" alt="round" />
      </div>
      <input
        ref="topLeftInput"
        v-model="value.topLeft"
        title="Top left corner radius"
        @focus="currentCornerFocus = CornerFocus.TopLeft"
        @input="handleRadiusChange"
        @keydown.enter="$emit('enter')"
      />
      <input
        v-model="value.topRight"
        title="Top right corner radius"
        @focus="currentCornerFocus = CornerFocus.TopRight"
        @input="handleRadiusChange"
        @keydown.enter="$emit('enter')"
      />
      <input
        v-model="value.bottomRight"
        title="Bottom right corner radius"
        @focus="currentCornerFocus = CornerFocus.BottomRight"
        @input="handleRadiusChange"
        @keydown.enter="$emit('enter')"
      />
      <input
        v-model="value.bottomLeft"
        title="Bottom left corner radius"
        @focus="currentCornerFocus = CornerFocus.BottomLeft"
        @input="handleRadiusChange"
        @keydown.enter="$emit('enter')"
      />
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import Component from 'vue-class-component';
import { Model, Prop, Ref } from 'vue-property-decorator';
import { RadiusInfo } from '@core/common/domain';

enum CornerFocus {
  TopLeft = 'top_left',
  TopRight = 'top_right',
  BottomRight = 'bottom_right',
  BottomLeft = 'bottom_left'
}

@Component
export default class IndependentCornerInput extends Vue {
  protected CornerFocus = CornerFocus;
  protected currentCornerFocus = CornerFocus.TopLeft;

  @Model('change', { required: false, type: Object, default: () => RadiusInfo.default() })
  protected readonly value!: RadiusInfo;

  @Ref()
  protected readonly topLeftInput!: HTMLInputElement;

  protected get rotateDeg(): string {
    switch (this.currentCornerFocus) {
      case CornerFocus.TopLeft:
        return '0deg';
      case CornerFocus.TopRight:
        return '90deg';
      case CornerFocus.BottomRight:
        return '180deg';
      case CornerFocus.BottomLeft:
        return '270deg';
      default:
        return '0deg';
    }
  }

  protected handleRadiusChange() {
    this.$emit('change', this.value);
  }

  public focus() {
    this.topLeftInput.focus();
    this.topLeftInput.select();
  }
}
</script>

<style lang="scss">
.independent-corner {
  padding-left: 1px;
  padding-right: 1px;

  &--label {
    display: block;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    margin-bottom: 8px;
    height: 18px;
  }

  &--input {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    box-shadow: 0 0 0 1px #d6d6d6;
    height: 40px;
    border-radius: 4px;

    &:hover,
    &:active,
    &:focus,
    &:focus-within {
      box-shadow: 0 0 0 1px var(--accent);
    }

    &--preview {
      width: 16px;
      margin-left: 7px;
      margin-right: 2px;
      margin-bottom: 2px;
      transition: transform 0.3s ease-in-out;

      img {
        width: 16px;
        height: 16px;
      }
    }

    input {
      flex: 1;
      width: 100%;
      height: 100%;
      border: none;
      border-right: 1px solid #d6d6d6;

      font-style: normal;
      font-weight: 400;
      font-size: 14px;
      line-height: 1.4;
      caret-color: var(--blue);
      color: var(--text-color);
      padding-left: 8px;
      padding-right: 8px;

      &::placeholder,
      :-ms-input-placeholder,
      ::-ms-input-placeholder {
        font-style: normal;
        font-weight: 400;
        font-size: 14px;
        line-height: 1.4;

        color: #677883;
      }

      &:last-child {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        border-right: none;
      }
    }
  }
}
</style>
