<template>
  <Chart v-if="!isLoading" class="h-100 w-100" ref="highchart" :options="chartOptions" :updateArgs="updateArgs"></Chart>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref, Watch } from 'vue-property-decorator';
import { Chart } from 'highcharts-vue';
import { ChartInfo, QueryRequest, SeriesOneResponse, WidgetId } from '@core/common/domain';
import { Inject as ServiceInjector } from 'typescript-ioc/dist/decorators';
import { QueryService } from '@core/common/services';
import { Log } from '@core/utils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';

@Component({ components: { Chart } })
export default class TrendAreaChart extends Vue {
  @Prop({ type: Object, default: null })
  private readonly chartInfo?: ChartInfo | null;

  @Prop({ type: String, default: '' })
  private readonly color!: string;

  @ServiceInjector
  private readonly queryService!: QueryService;

  @Ref()
  private readonly highchart!: Chart;

  private isLoading = true;

  async mounted() {
    await this.initData(this.chartInfo);
    this.$root.$on(DashboardEvents.ResizeWidget, this.handleResize);
  }

  beforeDestroy() {
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleResize);
  }

  private get updateArgs() {
    return [true, true, { duration: 1000 }];
  }

  private chartOptions = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0]
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    title: {
      text: ''
    },
    subtitle: {
      text: ''
    },
    xAxis: [
      {
        visible: false,
        startOnTick: false,
        endOnTick: false,
        maxPadding: 0,
        minPadding: 0
      }
    ],
    yAxis: [
      {
        visible: false,
        endOnTick: false,
        startOnTick: true,
        maxPadding: 0.01,
        minPadding: 0.01
      }
    ],
    legend: {
      enabled: false
    },
    tooltip: {
      enabled: false
    },
    plotOptions: {
      areaspline: {
        enableMouseTracking: false,
        lineWidth: 2,
        fillOpacity: 0.2,
        marker: {
          enabled: false
        },
        label: {
          enabled: false
        },
        color: ''
      }
    },
    series: [
      {
        data: []
      }
    ]
  };

  private async initData(chartInfo: ChartInfo | null | undefined) {
    try {
      if (chartInfo) {
        this.isLoading = true;
        const queryRequest: QueryRequest = QueryRequest.fromQuerySetting(chartInfo.setting);
        const response = (await this.queryService.query(queryRequest)) as SeriesOneResponse;
        if (response.hasData()) {
          //@ts-ignored
          this.chartOptions.series[0].data = response.series[0].data;
          this.chartOptions.plotOptions.areaspline.color = this.color;
        }
        this.isLoading = false;
      }
    } catch (ex) {
      Log.error(ex);
      this.isLoading = false;
    }
  }

  @Watch('color')
  onColorChanged(newColor: string, oldColor: string) {
    this.highchart.chart.update(
      {
        plotOptions: {
          spline: {
            color: this.color
          }
        }
      },
      newColor !== oldColor
    );
  }

  @Watch('chartInfo.setting', { deep: true })
  onQuerySettingChanged() {
    this.initData(this.chartInfo);
  }

  private handleResize(id: WidgetId) {
    if (id === this.chartInfo?.id) {
      this.highchart?.chart?.reflow();
    }
  }
}
</script>
