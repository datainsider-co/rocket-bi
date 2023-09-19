<template>
  <b-button-group v-bind="$attrs">
    <template v-for="(button, index) in buttons">
      <b-button v-if="!isHiddenButton(button)" :key="index" :actived="button.isActive" @click="onClick(button, ...arguments)" :title="button.tooltip">
        <img v-if="button.imgSrc" :src="require(`@/assets/icon/${button.imgSrc}`)" />
        {{ button.displayName }}
      </b-button>
    </template>
  </b-button-group>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { isFunction } from 'lodash';
import { Log } from '@core/utils';

export interface ButtonInfo {
  displayName: string;
  isActive?: boolean;
  id?: any;
  imgSrc?: string;
  tooltip?: string;
  isHidden?: boolean;
  onClick?: (event: MouseEvent, isSelected: boolean) => void;
}

@Component
export default class DiButtonGroup extends Vue {
  @Prop({ required: false, type: String })
  private readonly size!: string;

  @Prop({ required: false, type: Array, default: [] })
  private readonly buttons!: ButtonInfo[];

  @Prop({ required: false, type: Boolean, default: false })
  private readonly isMultiSelect!: boolean;

  private _buttons: ButtonInfo[] = [];

  @Watch('buttons')
  onButtonInfosChanged(newButtons: ButtonInfo[]) {
    this._buttons = newButtons;
  }

  private isHiddenButton(button: ButtonInfo) {
    return button?.isHidden ?? false;
  }

  mounted() {
    this._buttons = this.buttons;
  }

  onClick(targetBtn: ButtonInfo, event: MouseEvent) {
    if (this.isMultiSelect) {
      this.toggleButton(targetBtn, event);
    } else {
      this.selectButton(targetBtn, event);
    }
  }

  protected selectButton(targetBtn: ButtonInfo, event: MouseEvent): void {
    if (!targetBtn.isActive) {
      this._buttons.forEach(button => (button.isActive = false));
      targetBtn.isActive = true;
      if (isFunction(targetBtn.onClick)) {
        targetBtn.onClick(event, true);
      }

      this.$forceUpdate();
      this.$emit('change', targetBtn);
    }
    this.$emit('select', targetBtn);
  }

  protected toggleButton(targetBtn: ButtonInfo, event: MouseEvent): void {
    const newValue = !targetBtn.isActive;
    this.$set(targetBtn, 'isActive', newValue);
    if (isFunction(targetBtn.onClick)) {
      targetBtn.onClick(event, newValue);
    }
    this.$emit('change', targetBtn);
    this.$emit('select', targetBtn);
  }
}
</script>

<style lang="scss">
.btn-group {
  .btn-secondary {
    border: none !important;
    background: var(--primary) !important;
    padding: 5px 20px;
    color: var(--secondary-text-color) !important;

    &[actived] {
      background: var(--accent) !important;
      color: var(--secondary) !important;
    }
  }
}
</style>
