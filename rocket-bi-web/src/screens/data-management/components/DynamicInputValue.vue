<template>
  <div>
    <DiInputComponent
      ref="textInput"
      v-if="type === types.text"
      label="Default Text"
      placeHolder="Input text value"
      v-model="syncValue"
      @enter="$emit('enter')"
    />
    <DiInputComponent
      ref="numberInput"
      v-if="type === types.number"
      label="Default Number"
      placeHolder="Input number value"
      v-model="syncValue"
      type="number"
      @enter="$emit('enter')"
    />
    <DiInputDateTime v-if="type === types.date" :value.sync="syncValue" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync, Ref } from 'vue-property-decorator';
import { ParamValueType } from '@core/common/domain';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiInputDateTime from '@/screens/data-management/components/DiInputDateTime.vue';

@Component({ components: { DiInputComponent, DiInputDateTime } })
export default class DynamicInputValue extends Vue {
  private readonly types = ParamValueType;
  @Prop({ type: String, default: ParamValueType.text })
  private readonly type!: ParamValueType;
  @PropSync('value')
  private syncValue: any;
  @Ref()
  private readonly textInput?: DiInputComponent;
  @Ref()
  private readonly numberInput?: DiInputComponent;
  focus() {
    switch (this.type) {
      case ParamValueType.text:
        this.textInput?.focus();
        break;
      case ParamValueType.number:
        this.numberInput?.focus();
        break;
      case ParamValueType.date:
        break;
    }
  }
}
</script>

<style lang="scss" scoped></style>
