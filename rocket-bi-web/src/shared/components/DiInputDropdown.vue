<template>
  <DiInputComponent
    :label="label"
    :subtitle="subtitle"
    :type="type"
    :autocomplete="autocomplete"
    :disabled="disabled"
    :readonly="readonly"
    :border="border"
    v-bind="$attrs"
    :value="value"
    @input="input => $emit('input', input)"
    @change="value => $emit('change', value)"
    @onfocusout="$emit('onfocusout')"
    @enter="event => $emit('enter', event)"
    class="di-input-dropdown-component"
  >
    <template #suffix>
      <DiDropdown
        class="di-input-dropdown-component--dropdown"
        :data="dropdownOptions"
        :label-props="dropdownLabelProps"
        :value-props="dropdownValueProps"
        v-model="selectedDropdownValue"
        :placeholder="dropdownPlaceholder"
        :append-at-root="dropdownAppendAtRoot"
        border
      ></DiDropdown>
    </template>
  </DiInputComponent>
</template>
<script lang="ts">
import Vue from 'vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { Component, Model, Prop, PropSync } from 'vue-property-decorator';
import { DropdownData } from '@/shared/components/common/di-dropdown';

@Component({
  components: { DiDropdown, DiInputComponent },
  inheritAttrs: true
})
export default class DiInputDropdown extends Vue {
  @Model('input', { required: false, type: [String, Number], default: '' })
  private readonly value!: string;

  @Prop({ required: false, type: String })
  private readonly label!: string;

  @Prop({ required: false, type: String })
  private readonly subtitle!: string;

  @Prop({ required: false, type: String })
  private readonly type!: string;

  @Prop({ required: false, type: String, default: 'off' })
  private readonly autocomplete!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly disabled!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly readonly!: boolean;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly border!: boolean;

  @Prop({ required: true, type: Array })
  private readonly dropdownOptions!: DropdownData[];

  @Prop({ type: String, default: 'label' })
  private readonly dropdownValueProps!: string;

  @Prop({ type: String, default: 'value' })
  private readonly dropdownLabelProps!: string;

  @PropSync('dropdownValue', { required: false, type: String, default: '' })
  private readonly selectedDropdownValue!: string;

  @Prop({ type: String, default: '' })
  private readonly dropdownPlaceholder!: string;

  @Prop({ default: false, type: Boolean })
  private readonly dropdownAppendAtRoot!: boolean;
}
</script>

<style lang="scss">
.di-input-dropdown-component {
  &--dropdown[border] {
    width: max-content;
    max-width: 33%;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow: none !important;
    border-left: 1px solid #d6d6d6;

    .di-dropdown--button {
      padding: 0 6px;
      &--left {
        margin-right: 2px;
      }

      &--right {
        img {
          width: 20px;
          height: 20px;
          margin: 0;
          padding: 0;
        }
      }
    }
  }
}
</style>
