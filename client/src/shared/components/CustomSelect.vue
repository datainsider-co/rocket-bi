<template>
  <BSelect v-model="index">
    <BFormSelectOption v-if="placeholderText" value="-1" selected disabled>{{ placeholderText }} </BFormSelectOption>
    <BSelectOption v-for="(option, index) in options" :key="index" :value="index" :disabled="option.disable">{{ option.displayName }} </BSelectOption>
  </BSelect>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { SelectOption } from '@/shared';

@Component
export default class CustomSelect extends Vue {
  @Prop()
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
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/di-variables';

select {
  background-color: $widgetColor;
  padding: 0 16px;
  color: var(--text-color);
  line-height: 1.4;
  background-image: url('~@/assets/icon/ic_thin_dropdown.svg');
  background-repeat: no-repeat;
  background-position: calc(100% - 15px);
  background-origin: border-box;
  min-height: 42px;
}
</style>
