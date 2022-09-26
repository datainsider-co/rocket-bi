<template>
  <ChartHolder v-if="isChart(widget.className)" :meta-data="widget" :showEditComponent="isShowEdit" />
  <!--    <FilterContainer v-else-if="isFilter(widget.className)" :filter="widget" :showEditComponent="isShowEdit" />-->
  <OtherWidget v-else :showEditComponent="isShowEdit" :widget="widget" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Widget, Widgets } from '@core/domain/Model';
import OtherWidget from '@/screens/DashboardDetail/components/WidgetContainer/other/OtherWidget.vue';
import FilterContainer from '@filter/FilterContainer.vue';
import ChartHolder from './charts/ChartHolder.vue';

@Component({
  components: {
    ChartHolder,
    FilterContainer,
    OtherWidget
  }
})
export default class WidgetContainer extends Vue {
  @Prop({ required: true })
  private readonly widget!: Widget;

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
