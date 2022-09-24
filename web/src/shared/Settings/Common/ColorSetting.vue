<template>
  <div :class="{ 'disabled-setting': disable }" class="setting-container no-gutters">
    <div v-if="label != null" class="label single-line mb-2">{{ label }}</div>
    <div class="w-100 d-flex justify-content-between align-items-center">
      <ColorPicker
        :id="genBtnId(id)"
        :allowValueNull="true"
        :allowWatchValueChange="true"
        :class="`color-component ${size}`"
        :defaultColor="defaultColor"
        :value="currentValue"
        @change="handlePickColor"
      />
      <RevertButton v-if="enabledRevert" style="text-align: right" @click="handleRevert" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import ColorPicker from '@/shared/components/ColorPicker.vue';
import { SettingSize } from '@/shared/Settings/Common/SettingSize';

@Component({
  components: {
    ColorPicker
  }
})
export default class ColorSetting extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;
  @Prop({ required: false, type: String })
  private readonly label!: string;
  @Prop({ required: true, type: String })
  private readonly value!: string;

  @Prop({ required: true, type: String, default: '' })
  private readonly defaultColor!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, default: false })
  private readonly enabledRevert!: boolean;

  @Prop({ default: SettingSize.full })
  private readonly size!: SettingSize;

  private currentValue = this.value;

  @Watch('value')
  handleValueChange(newValue: string) {
    this.currentValue = newValue;
  }

  private handlePickColor(newColor: string): void {
    if (newColor != this.currentValue) {
      this.currentValue = newColor;
      this.$emit('onChanged', newColor);
    }
  }

  private handleRevert() {
    this.$emit('onRevert');
  }
}
</script>

<style lang="scss">
@import '~bootstrap/scss/bootstrap-grid';

.setting-container {
  input {
    padding: 10px 0 10px 8px;

    @include media-breakpoint-down(lg) {
      padding: 5px 10px;
    }
  }
}
</style>
