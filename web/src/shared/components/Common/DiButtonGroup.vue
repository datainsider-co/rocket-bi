<template>
  <b-button-group v-bind="$attrs">
    <template v-for="(button, index) in buttons">
      <b-button
        v-if="!isHiddenButton(button)"
        :key="index"
        :actived="button.isActive"
        @click="clickButton(button, ...arguments)"
        v-b-tooltip="button.tooltip"
        >{{ button.displayName }}</b-button
      >
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
  tooltip?: string;
  isHidden?: boolean;
  onClick?: (event: MouseEvent) => void;
}

@Component
export default class DiButtonGroup extends Vue {
  @Prop({ required: false, type: String })
  private readonly size!: string;

  @Prop({ required: false, type: Array, default: [] })
  private readonly buttons!: ButtonInfo[];

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

  private clickButton(buttonInfo: ButtonInfo, event: MouseEvent) {
    if (!buttonInfo.isActive) {
      Log.info('clickInfo:;', buttonInfo);
      this._buttons.forEach(button => (button.isActive = false));
      buttonInfo.isActive = true;
      if (isFunction(buttonInfo.onClick)) {
        buttonInfo.onClick(event);
      }

      this.$forceUpdate();
      this.$emit('change', buttonInfo);
    }
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
