<template>
  <div :id="genBtnId(`${settingItem.name}`)" class="setting-container toggle-setting">
    <p class="col-3 label text-break">{{ settingItem.name }}</p>
    <DiToggle class="col-9 " style="padding-left: 40px" :value="value" @update:value="toggleButton"></DiToggle>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';

@Component
export default class ToggleSettingComponent extends Vue {
  @Prop({ required: true })
  private readonly settingItem!: SettingItem;
  private value = this.settingItem.value;

  toggleButton(newValue: boolean) {
    this.value = newValue;
    this.$emit('onChanged', this.settingItem.key, newValue);
  }
}
</script>
