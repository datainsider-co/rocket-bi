<template>
  <div class="tab-filter-container flex-column">
    <div class="d-flex row filter-chart single-line px-3 mb-2 single-line" v-if="title" :title="title" :style="titleStyle">
      {{ title }}
    </div>
    <div class="d-flex row m-0 mb-1 w-100 single-line" v-if="subtitle" :style="subtitleStyle">
      <div>{{ subtitle }}</div>
    </div>
    <InputSetting
      :id="idAsString"
      :value="currentValue"
      :placeholder="placeHolder"
      :type="type"
      :applyFormatNumber="useApplyFormatter"
      @onChanged="handleValueChange"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import { Condition, DynamicFunctionWidget, FilterRequest } from '@core/common/domain';
import { IdGenerator } from '@/utils/IdGenerator';
import { InputType } from '@/shared/settings/common/InputSetting.vue';
import { StringUtils } from '@/utils/StringUtils';
import { DashboardControllerModule } from '@/screens/dashboard-detail/stores';
import { DynamicControlData } from '@/screens/dashboard-detail/intefaces/DynamicControlData';
import { DynamicConditionWidget } from '@core/common/domain/model/widget/filter/DynamicConditionWidget';
import { get } from 'lodash';
import { _ConfigBuilderStore } from '@/screens/chart-builder/config-builder/ConfigBuilderStore';
import { Log } from '@core/utils';

@Component({ components: {} })
export default class InputControlViewer extends Vue {
  @Prop({ required: true })
  private readonly widget!: DynamicConditionWidget;

  @Prop({ required: false, default: false })
  private readonly showEditComponent!: boolean;

  @Prop({ required: false, default: false })
  private readonly isPreview!: boolean;

  currentValue: string = this.valueInWidget;

  private get valueInWidget(): string {
    return this.widget.values[0] ?? '';
  }

  @Watch('valueInWidget')
  onValueChanged(value: string) {
    this.currentValue = value;
  }

  get subtitleStyle() {
    return {
      ...this.widget.options.subtitle?.style,
      justifyContent: this.widget.options.subtitle?.align
    };
  }

  get title(): string {
    return this.widget.getTitle();
  }

  get subtitle(): string {
    return this.widget.getSubtitle();
  }

  get titleStyle() {
    return {
      ...this.widget.options.title?.style,
      justifyContent: this.widget.options.title?.align
    };
  }

  private get idAsString(): string {
    return IdGenerator.generateInputId(`control-${this.widget.id}`);
  }

  get placeHolder(): string {
    return this.widget.options?.placeHolder ?? '';
  }

  get type(): string {
    return this.widget.options?.inputType ?? InputType.Text;
  }

  get useApplyFormatter(): boolean {
    return this.type === InputType.Number;
  }

  private saveTempSelectedValue(values: string[]) {
    _ConfigBuilderStore.setTempFilterValue({
      value: values
    });
  }

  handleValueChange(value: string) {
    if (this.currentValue !== value) {
      this.currentValue = value;
      if (this.isPreview) {
        this.saveTempSelectedValue(StringUtils.isEmpty(this.currentValue) ? [] : [this.currentValue]);
      } else {
        Log.debug('handleValueChange');
        DashboardControllerModule.replaceDynamicFilter({
          widget: this.widget,
          values: StringUtils.isEmpty(this.currentValue) ? [] : [this.currentValue],
          apply: true
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped></style>
