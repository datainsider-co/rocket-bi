<template>
  <div class="icon-picker">
    <div :id="id" class="icon-picker-preview" tabindex="-1" @click.prevent="toggleShowPicker">
      <div class="unselectable" v-html="value"></div>
    </div>
    <BPopover :id="`${id}-popover`" :show.sync="isPickerShowing" :target="id" container="body" custom-class="icon-picker-popover" triggers="blur">
      <vuescroll class="icon-scroller">
        <div class="icon-listing">
          <template v-for="(icon, index) in Icons">
            <div :key="index" class="unselectable" @click="emitValueChange(icon)" v-html="icon"></div>
          </template>
        </div>
      </vuescroll>
    </BPopover>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { RandomUtils } from '@/utils';
import { FormattingOptions } from '@/shared/settings/common/conditional-formatting/FormattingOptions';

@Component
export default class IconPicker extends Vue {
  private readonly Icons: string[] = FormattingOptions.getIcons();

  @Prop({ required: true, type: String, default: '' })
  private readonly value!: string;

  @Prop({ required: false, type: String, default: () => RandomUtils.nextString() })
  private readonly id!: string;

  private isPickerShowing = false;

  @Emit('change')
  private emitValueChange(newValue: string) {
    return newValue;
  }

  private toggleShowPicker() {
    this.isPickerShowing = !this.isPickerShowing;
  }
}
</script>

<style lang="scss">
.icon-picker-preview {
  background-color: var(--input-background-color);
  border-radius: 4px;
  cursor: pointer;
  height: 34px;
  padding: 8px;
  width: 34px;

  > div {
    height: 100%;
    line-height: normal;
    width: 100%;
  }
}

.icon-picker-popover {
  background: none;
  border: none;
  max-height: 200px;
  max-width: 300px;
  overflow: hidden;

  .arrow {
    display: none;
  }

  .popover-body {
    background: var(--menu-background-color);
    border: var(--menu-border);
    border-radius: 4px;
    box-shadow: var(--menu-shadow);
    height: 200px;

    .icon-scroller {
      position: initial !important;

      .__bar-is-vertical {
        right: 2px !important;
      }

      .icon-listing {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;

        > div {
          box-sizing: content-box;
          color: var(--text-color);
          cursor: pointer;
          font-size: 20px;
          height: 24px;
          line-height: normal;
          padding: 4px;
          text-align: center;
          width: 24px;

          &:hover {
            background: var(--active-color);
          }

          //height: 24px;
          //width: 24px;
        }
      }
    }
  }
}
</style>
