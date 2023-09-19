<template>
  <div class="setting-container align-setting no-gutters" :class="{ 'disabled-setting': disable }">
    <div v-if="isLabel || showHint" class="label d-flex flex-row align-items-center">
      <p v-if="isLabel" class="single-line m-0">{{ label }}</p>
      <span v-if="showHint" class="di-icon-help ml-2" v-b-tooltip.auto="hint"></span>
    </div>
    <div class="d-flex align-items-center justify-content-between align-container" style="height: 34px ">
      <b-icon-text-left :class="`${iconClass(`left`)}`" @click="selectAlign(`left`)" />
      <b-icon-text-center :class="`${iconClass(`center`)}`" @click="selectAlign(`center`)" />
      <b-icon-text-right :class="`${iconClass(`right`)}`" @click="selectAlign(`right`)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { StringUtils } from '@/utils';

@Component({})
export default class AlignSetting extends Vue {
  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: true })
  private readonly value!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disable!: boolean;

  @Prop({ type: String, default: '' })
  private readonly hint!: string;

  private selectValue = this.value;

  @Watch('value')
  handleValueChange(newValue: string) {
    this.selectValue = newValue;
  }

  private selectAlign(newAlign: string): void {
    if (newAlign != this.selectValue) {
      this.selectValue = newAlign;
      this.$emit('onChanged', this.selectValue);
    }
  }

  private iconClass(align: string) {
    const classString = 'btn-icon btn-ghost di-popup ic-16';
    return this.selectValue == align ? `${classString} active` : `${classString}`;
  }

  private get showHint(): boolean {
    return StringUtils.isNotEmpty(this.hint);
  }

  private get isLabel(): boolean {
    return StringUtils.isNotEmpty(this.label);
  }
}
</script>
