<template>
  <div class="setting-container no-gutters">
    <div class="col-3 label single-line">{{ settingItem.name }}</div>
    <div class="col-7">
      <ColorPicker
        :id="genBtnId(settingItem.key)"
        :value="value"
        @change="handlePickColor"
        :allowValueNull="true"
        :allowWatchValueChange="true"
        :defaultColor="settingItem.defaultValue"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, PropSync, Vue } from 'vue-property-decorator';
import ColorPicker from '@/shared/components/ColorPicker.vue';
import { SettingItem } from '@/shared/models';
import { Log } from '@core/utils';

@Component({
  components: {
    ColorPicker
  }
})
export default class ColorInputComponent extends Vue {
  @Prop({ required: true })
  settingItem!: SettingItem;

  private value = this.settingItem.value || this.settingItem.defaultValue;

  private handlePickColor(newColor: string): void {
    if (newColor != this.value) {
      this.value = newColor;
      this.$emit('onChanged', this.settingItem.key, newColor);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~bootstrap/scss/bootstrap-grid';

::v-deep {
  input {
    padding: 10px 16px;

    @include media-breakpoint-down(lg) {
      padding: 5px 10px;
    }
  }
}
</style>
