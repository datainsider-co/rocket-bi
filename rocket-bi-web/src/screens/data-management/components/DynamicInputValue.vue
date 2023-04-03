<template>
  <div>
    <DiInputComponent
      ref="textInput"
      v-if="type === types.text"
      label="Default Text"
      placeholder="Input text value"
      v-model="syncValue"
      @enter="$emit('enter')"
    />
    <DiInputComponent
      ref="numberInput"
      v-if="type === types.number"
      label="Default Number"
      placeholder="Input number value"
      v-model="syncValue"
      type="number"
      @enter="$emit('enter')"
    />
    <DiInputDateTime v-if="type === types.date" :value.sync="syncValue" />
    <template v-if="type === types.list">
      <div>
        <label>Default select</label>

        <DiDropdown placeholder="Select default value..." :data="listAsOptions" v-model="syncValue" valueProps="id" labelProps="name" />
      </div>
      <div class="mt-3">
        <label>List values</label>
        <BFormTextarea
          class="array-area"
          ref="textArea"
          label="Parameter"
          v-model="listString"
          :debounce="500"
          @input="onChangeListString"
          placeholder="Input list values"
          @enter="$emit('enter')"
        />
        <div class="mt-2">Separate values with newlines.</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, PropSync, Ref } from 'vue-property-decorator';
import { ParamValueType } from '@core/common/domain';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiInputDateTime from '@/screens/data-management/components/DiInputDateTime.vue';
import { StringUtils, ListUtils } from '@/utils';

@Component({ components: { DiInputComponent, DiInputDateTime } })
export default class DynamicInputValue extends Vue {
  private readonly types = ParamValueType;

  @Prop({ type: String, default: ParamValueType.text })
  private readonly type!: ParamValueType;

  @PropSync('value')
  private syncValue: any;

  @Prop()
  private list!: string[];

  @Ref()
  private readonly textInput?: DiInputComponent;
  @Ref()
  private readonly numberInput?: DiInputComponent;

  private get listString() {
    return this.list.join('\n');
  }

  private get listAsOptions() {
    return this.list.map(value => {
      return {
        id: value,
        name: value
      };
    });
  }

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

  private updateListValue(newList: string[]) {
    if (!newList.includes(this.syncValue)) {
      this.syncValue = ListUtils.getHead(newList) || '';
    }
  }

  onChangeListString(text: string) {
    const list = text.split('\n').filter(value => !StringUtils.isEmpty(value));
    this.$emit('setList', list);
    this.updateListValue(list);
  }
}
</script>

<style lang="scss">
.array-area {
  height: 180px !important;
  padding: 12px;
}
</style>
