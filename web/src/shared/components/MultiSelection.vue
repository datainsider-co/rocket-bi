<template>
  <vuescroll class="multi-selection" @handle-scroll="onScroll" :ops="scrollConfig">
    <b-form-checkbox-group class="w-100" stacked v-model="selectedColumns">
      <div>
        <template v-for="(item, index) in options">
          <b-form-checkbox :key="index" :value="item[keyField]" :disabled="item.disabled">
            {{ item[keyLabel] }}
          </b-form-checkbox>
        </template>
      </div>
    </b-form-checkbox-group>
  </vuescroll>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import { CheckboxGroupOption } from '../interfaces';
import { VerticalScrollConfigs } from '@/shared';

@Component
export default class MultiSelection extends Vue {
  private readonly scrollConfig = VerticalScrollConfigs;

  @Prop({ required: true, type: Array })
  private readonly options!: CheckboxGroupOption[];

  @Prop({ required: true, type: Array })
  private readonly model!: string[];

  @Prop({ required: false, type: String, default: () => `multi-selection-${Date.now()}` })
  private readonly id!: string;

  @Prop({ required: false, type: String, default: 'value' })
  private readonly keyField!: string;

  @Prop({ required: false, type: String, default: 'text' })
  private readonly keyLabel!: string;

  selectedColumns: string[];

  // @Ref()
  // scroller!: any;

  constructor() {
    super();
    this.selectedColumns = this.model;
  }

  @Watch('model', { immediate: true, deep: true })
  modelChanged() {
    this.selectedColumns = this.model;
  }

  @Watch('selectedColumns')
  selectedColumnsChanged() {
    this.$emit('selectedColumnsChanged', this.selectedColumns);
  }

  @Emit('onScroll')
  private onScroll(vertical: { process: number }) {
    const { process } = vertical;
    return process;
  }
}
</script>

<style lang="scss">
.multi-selection {
  input[type='checkbox'],
  input[type='checkbox'] + label {
    cursor: pointer;
  }

  .custom-control-label::before {
    background-color: transparent !important;
    border: 1px solid var(--secondary-text-color) !important;
    border-radius: 2px;
    background-image: unset !important;
  }

  .custom-control-input:checked ~ .custom-control-label::after {
    border-radius: 2px;
    font-family: 'data-insider-icon' !important;
    font-size: 14px;
    content: '\e931';
    background-color: var(--accent);
    background-image: unset !important;
    color: var(--white);
    text-align: center;
    line-height: 1;
  }

  .custom-control-input:checked ~ .custom-control-label::before {
    border: none !important;
  }

  .custom-control-label {
    font-weight: normal;
    font-stretch: normal;
    font-style: normal;
    cursor: default;
    font-size: 16px !important;
    letter-spacing: 0.27px !important;
    color: var(--secondary-text-color) !important;
    line-height: 1.4;
    margin: 6px 0;
  }
}
</style>
