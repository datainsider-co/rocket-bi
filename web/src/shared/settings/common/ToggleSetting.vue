<template>
  <div :id="genBtnId(`${id}`)" :class="{ 'disabled-setting': disable }" class="setting-container toggle toggle-setting">
    <DiToggle :value="selectedValue" @update:value="toggleButton" :disable="disable" :label="label"></DiToggle>
    <span v-if="showHint" :id="`tooltip-icon-${id}`" class="di-icon-help ml-2"></span>
    <b-tooltip v-if="showHint" :target="`tooltip-icon-${id}`" triggers="hover">
      <div v-html="hint" />
    </b-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { StringUtils } from '@/utils';

@Component({})
export default class ToggleSetting extends Vue {
  @Prop({ required: true, type: String })
  private readonly id!: string;

  @Prop({ required: true, type: String })
  private readonly label!: string;

  @Prop({ required: true, type: Boolean })
  private readonly value!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  private selectedValue = this.value;

  @Watch('value')
  private onValueChanged(newValue: boolean) {
    this.selectedValue = newValue;
  }

  toggleButton(newValue: boolean) {
    if (!this.disable) {
      this.selectedValue = newValue;
      this.$emit('onChanged', newValue);
    }
  }

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }
}
</script>
