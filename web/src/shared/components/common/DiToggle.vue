<template>
  <div
    :id="id"
    class="di-toggle-component"
    @click.prevent="toggleValue"
    :disabled="disable"
    :class="{
      'label-at-left': labelAt === 'left',
      'justify-content-between': isFill
    }"
  >
    <div class="di-toggle">
      <input v-model="syncValue" class="di-toggle--input" type="checkbox" :disabled="disable" />
      <span class="di-toggle--slider di-toggle--round"></span>
    </div>
    <div class="di-toggle-component--label">
      {{ label }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue, Watch } from 'vue-property-decorator';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component
export default class DiToggle extends Vue {
  @PropSync('value', { default: false })
  private syncValue!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, type: String, default: '' })
  private readonly label!: string;

  @Prop({ required: false, type: String })
  private readonly id!: string;

  /**
   * show label in front of toggle
   *
   * @private
   */
  @Prop({ required: false, type: String, default: 'right' })
  private readonly labelAt!: 'left' | 'right';

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isFill!: boolean;

  private toggleValue() {
    if (!this.disable) {
      this.syncValue = !this.syncValue;
      this.$emit('onSelected', this.syncValue);
    }
  }

  @Watch('syncValue')
  onValueChange(newValue: boolean) {
    TrackingUtils.track(`toggle-${this.id}`, { value: newValue });
  }
}
</script>

<style lang="scss">
.di-toggle-component {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  .di-toggle {
    position: relative;
    display: inline-block;
    width: 27px;
    height: 16px;

    &--input {
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .di-toggle--slider {
        background-color: var(--accent--root);
      }

      &:focus + .di-toggle--slider {
        box-shadow: 0 0 1px var(--accent--root);
      }

      &:checked + .di-toggle--slider:before {
        -webkit-transform: translateX(10px);
        -ms-transform: translateX(10px);
        transform: translateX(10px);
      }
    }

    &--slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      -webkit-transition: 0.4s;
      transition: 0.4s;

      &:before {
        position: absolute;
        content: '';
        height: 10px;
        width: 10px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        -webkit-transition: 0.4s;
        transition: 0.4s;
      }
    }

    /* Rounded sliders */
    .di-toggle--slider.di-toggle--round {
      border-radius: 16px;
    }

    .di-toggle--slider.di-toggle--round:before {
      border-radius: 50%;
    }
  }

  .di-toggle + .di-toggle-component--label {
    margin-left: 8px;
  }

  &.label-at-left {
    .di-toggle {
      order: 1;
    }
    .di-toggle-component--label {
      order: 0;
    }
    .di-toggle + .di-toggle-component--label {
      margin-left: 0;
      margin-right: 8px;
    }
  }

  &--label {
    cursor: pointer;
    color: var(--text-color);
    font-size: 14px;
    font-weight: normal;
    line-height: 1.4;
    letter-spacing: 0.27px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  &[disabled] {
    opacity: var(--disable-opacity);
    cursor: not-allowed;

    * {
      cursor: not-allowed;
    }
  }
}
</style>
