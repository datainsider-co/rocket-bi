<template>
  <CaptureException ref="captureException" @error="handleOnErrorChanged" @reset="handleOnErrorChanged">
    <template v-slot:default="{ error }">
      <template v-if="error || isForceShowExampleChart">
        <div class="display-error error" v-if="error">{{ error.message }}</div>
      </template>
      <template v-else>
        <component
          v-if="toComponent"
          :is="toComponent"
          :key="id"
          :id="id"
          :title="title"
          :subTitle="subTitle"
          :setting="setting"
          :data="data"
          :backgroundColor="backgroundColor"
          :textColor="textColor"
          :class="filterClass"
        >
        </component>
        <div v-else>{{ filterType }} widget unsupported</div>
      </template>
    </template>
  </CaptureException>
</template>

<script lang="ts">
import { Component, Emit, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { Widgets } from '@core/domain/Model';
import InputFilter from '@filter/InputFilter.vue';
import MonthFilter from '@filter/MonthFilter.vue';
import DateRangeFilter from '@filter/DateRangeFilter.vue';
import DateSingleFilter from '@filter/DateSingleFilter.vue';
import CaptureException from '@/shared/components/CaptureException';

@Component({
  components: {
    InputFilter,
    MonthFilter,
    DateRangeFilter,
    DateSingleFilter,
    CaptureException
  }
})
/**
 * @deprecated
 */
export default class FilterWidget extends Vue {
  static readonly components = new Map<string, string>([
    // [Widgets.queryDropDownFilter, 'DropdownFilter'],
    [Widgets.RangeDateFilter, 'DateRangeFilter'],
    [Widgets.DateFilter, 'DateSingleFilter'],
    [Widgets.InputValueFilter, 'InputFilter']
  ]);

  @Prop({ required: true, type: String, default: '' })
  filterType!: string;

  @Prop({ required: true })
  setting!: any;

  @Prop({ required: true })
  data!: any;

  @Prop({ default: -1 })
  id!: string | number;

  @Prop()
  title?: string;

  @Prop()
  subTitle?: string;

  @Prop({ default: '', type: String })
  filterName!: string;

  @Prop({ default: false, type: Boolean })
  isForceShowExampleChart!: boolean;

  @Prop()
  backgroundColor?: string;

  @Prop()
  textColor?: string;

  @Prop({ default: false, type: Boolean })
  showEditComponent!: boolean;

  @Ref()
  captureException!: CaptureException;

  @Watch('chartSetting')
  onChartSettingChanged() {
    // this.captureException.reset();
  }

  @Emit('onError')
  private handleOnErrorChanged(error: any) {
    return error;
  }

  private get toComponent(): string | undefined {
    return FilterWidget.components.get(this.filterType);
  }

  private get filterClass(): string {
    return this.showEditComponent ? 'disable' : '';
  }
}
</script>

<style lang="scss" scoped>
.pad-l-15 {
  padding-left: 15px;
}
</style>
