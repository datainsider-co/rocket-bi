<template>
  <ChartHolder v-if="isChart(widget.className)" :meta-data="widget" :showEditComponent="isShowEdit" :widget-setting="widgetSetting" />
  <OtherWidget v-else :showEditComponent="isShowEdit" :widget="widget" :widget-setting="widgetSetting" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Widget, Widgets, WidgetSetting } from '@core/common/domain/model';
import OtherWidget from '@/screens/dashboard-detail/components/widget-container/other/OtherWidget.vue';
import ChartHolder from './charts/ChartHolder.vue';

@Component({
  components: {
    ChartHolder,
    OtherWidget
  }
})
export default class WidgetHolder extends Vue {
  @Prop({ required: true, type: Object })
  private readonly widget!: Widget;

  @Prop({ required: true, type: Object })
  protected readonly widgetSetting!: WidgetSetting;

  @Prop({ default: false, type: Boolean })
  private readonly isShowEdit!: boolean;

  isChart(className: string): boolean {
    return className == Widgets.Chart;
  }

  // isFilter(className: string): boolean {
  //   return className.endsWith('_filter');
  // }
}
</script>
