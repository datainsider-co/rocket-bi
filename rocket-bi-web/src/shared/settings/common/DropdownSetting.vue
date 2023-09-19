<template>
  <div :class="{ 'disabled-setting': disable }" class="setting-container dropdown-setting">
    <div v-if="enabledRevert || isLabel" class="label justify-content-between w-100">
      <div class="d-flex flex-row align-items-center">
        <p v-if="isLabel">{{ label }}</p>
        <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
      </div>
      <RevertButton v-if="enabledRevert" @click="handleRevert" />
    </div>
    <DiDropdown
      :id="id"
      v-model="selected"
      :appendAtRoot="true"
      :class="`selection ${size}`"
      :data="options"
      :boundary="boundary"
      labelProps="displayName"
      valueProps="id"
      @selected="handleItemSelect"
    >
      <template #selected-item="{selectedItem, label, placeholder}">
        <slot name="selected-icon" v-bind="{ selectedItem, label, placeholder }"></slot>
      </template>
      <template #option-item="{item, isSelected, getLabel}">
        <slot name="option-item" v-bind="{ item, isSelected, getLabel }"></slot>
      </template>
    </DiDropdown>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
import { SettingSize } from '@/shared/settings/common/SettingSize';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { StringUtils } from '@/utils';

@Component({
  components: {
    DiDropdown
  }
})
export default class DropdownSetting extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;
  @Prop({ required: false, type: String })
  private readonly label!: string;
  @Prop({ required: true, default: '' })
  private readonly value!: boolean | string | number;

  @Prop({ required: true, type: Array })
  private readonly options!: SelectOption[];

  @Prop({ default: SettingSize.full })
  private readonly size!: SettingSize;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ required: false, default: false })
  private readonly enabledRevert!: boolean;

  @Prop({ required: false, type: String, default: 'window' })
  private readonly boundary!: string;

  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  private selected = this.value;

  @Watch('value')
  handleValueChange(newValue: string) {
    this.selected = newValue;
  }

  handleItemSelect(item: SelectOption) {
    this.$emit('onChanged', item.id);
    this.$emit('onSelected', item);
  }

  handleRevert() {
    this.$emit('onRevert');
  }

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }

  private get isLabel(): boolean {
    return StringUtils.isNotEmpty(this.label);
  }
}
</script>
