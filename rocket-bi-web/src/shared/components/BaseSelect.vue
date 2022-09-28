<template>
  <div class="d-flex flex-row h-100 align-items-center w-100">
    <img src="@/assets/icon/charts/ic_dropdown.svg" class="ic-16" />
    <BSelect class="w-100" v-model="index">
      <BFormSelectOption value="-1" selected disabled>{{ placeholderText }}</BFormSelectOption>
      <BSelectOption v-for="(option, index) in options" :key="index" :value="index">{{ option.displayName }} </BSelectOption>
    </BSelect>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { SelectOption } from '@/shared';

@Component
class BaseSelect extends Vue {
  @Prop({ default: 'Please select an item' })
  placeholderText!: string;

  @Prop({ default: [] })
  options!: SelectOption[];

  @Prop()
  selected!: SelectOption;

  @Prop({ default: true })
  closeOnOutsideClick!: boolean;

  index = -1;

  mounted() {
    if (this.selected) {
      this.index = this.options.indexOf(this.selected);
    }
  }

  @Watch('index')
  indexChange(newValue: number): void {
    this.$emit('change', this.options[newValue]);
  }
}

export default BaseSelect;
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/di-variables';

select {
  background-color: $widgetColor;
  opacity: 0.5;
  font-size: 14px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  padding-left: 8px;
  color: var(--text-color);
}
</style>
