import _Vue from 'vue';
import VueHighcharts from 'vue2-highcharts';
// import DarkUnica from 'highcharts/themes/dark-unica';
import Highcharts from 'highcharts';
import BoostCanvas from 'highcharts/modules/boost-canvas';
import Boost from 'highcharts/modules/boost';
import More from 'highcharts/highcharts-more';
import Sankey from 'highcharts/modules/sankey';
import ExportData from 'highcharts/modules/export-data';
import Exporting from 'highcharts/modules/exporting';
import ItemSeries from 'highcharts/modules/item-series';
// import SeriesChart from './SeriesChart';
// import DefaultTable from '@chart/Table/DefaultTable/DefaultTable';
import Data from 'highcharts/modules/data';
import Label from 'highcharts/modules/series-label';
import Accessibility from 'highcharts/modules/accessibility';
import Heatmap from 'highcharts/modules/heatmap';
import BellCurve from 'highcharts/modules/histogram-bellcurve';
// import Histogram from 'highcharts/modules/histogram-bellcurve';
import Drilldown from 'highcharts/modules/drilldown';
import Funnel from 'highcharts/modules/funnel';
// import Pyramid from 'highcharts/modules/funnel';
import SolidGauge from 'highcharts/modules/solid-gauge';
import Pareto from 'highcharts/modules/pareto';
import TreeMap from 'highcharts/modules/treemap';
import WordCloud from 'highcharts/modules/wordcloud';
import Lollipop from 'highcharts/modules/lollipop';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import Bullet from 'highcharts/modules/bullet';

// TODO: import của highchart để chung trong 1 file

// DarkUnica(Highcharts);
BoostCanvas(Highcharts);
Boost(Highcharts);
More(Highcharts);
Exporting(Highcharts);
ExportData(Highcharts);

// Series
Label(Highcharts);
ItemSeries(Highcharts);
Accessibility(Highcharts);

// heatmap
Data(Highcharts);
Heatmap(Highcharts);

// Bell
BellCurve(Highcharts); //No remove it

Drilldown(Highcharts);
Funnel(Highcharts);
SolidGauge(Highcharts);
// Histogram(Highcharts);

Pareto(Highcharts);
// Pyramid(Highcharts);
TreeMap(Highcharts);
WordCloud(Highcharts);
Sankey(Highcharts);
Lollipop(Highcharts);
DependencyWheel(Highcharts);
Bullet(Highcharts);
// Exporting(Highcharts);
// import DropdownFilter from '@chart/DropdownFilter';
// import HeatMapChart from '@chart/HeatMapChart';

const SeriesChart = () => import(/* webpackChunkName: "charts" */ './SeriesChart');
const PieChart = () => import(/* webpackChunkName: "charts" */ './PieChart');
const FunnelChart = () => import(/* webpackChunkName: "charts" */ './FunnelChart');
const PyramidChart = () => import(/* webpackChunkName: "charts" */ './PyramidChart');
const ScatterChart = () => import(/* webpackChunkName: "charts" */ './ScatterChart');
const DrilldownChart = () => import(/* webpackChunkName: "charts" */ './DrilldownChart');
const DrilldownPieChart = () => import(/* webpackChunkName: "charts" */ './DrilldownPieChart');
const HeatMapChart = () => import(/* webpackChunkName: "charts" */ './HeatMapChart');
const BubbleChart = () => import(/* webpackChunkName: "charts" */ './BubbleChart');
const ParetoChart = () => import(/* webpackChunkName: "charts" */ './ParetoChart');
const HistogramChart = () => import(/* webpackChunkName: "charts" */ './HistogramChart');
const BellCurveChart = () => import(/* webpackChunkName: "charts" */ './BellCurveChart');
const BellCurve2Chart = () => import(/* webpackChunkName: "charts" */ './BellCurve2Chart');
const GaugeChart = () => import(/* webpackChunkName: "charts" */ './GaugeChart');
const TreeMapChart = () => import(/* webpackChunkName: "charts" */ './TreeMapChart');
// const HighchartsTreeMapLevelChart = () => import(/* webpackChunkName: "charts" */ './TreeMapLevelChart.js');
const KPIWidget = () => import(/* webpackChunkName: "charts" */ './NumberWidget/NumberWidget');
// const TableChart = () => import(/* webpackChunkName: "charts" */ './TableChart/TableChart');
const WordCloudChart = () => import(/* webpackChunkName: "charts" */ './WordCloudChart');
const StackingSeriesChart = () => import(/* webpackChunkName: "charts" */ './StackingSeriesChart');
const MapChart = () => import(/* webpackChunkName: "charts" */ './MapChart');
const ParliamentChart = () => import(/* webpackChunkName: "charts" */ './ParliamentChart');

const DropdownFilter = () => import(/* webpackChunkName: "filters" */ './DropdownFilter');
const TabFilter = () => import(/* webpackChunkName: "filters" */ './TabFilter');
const SpiderWebChart = () => import(/* webpackChunkName: "filters" */ './SpiderWebChart');
const SankeyChart = () => import(/* webpackChunkName: "filters" */ './SankeyChart');
const SlicerFilter = () => import(/* webpackChunkName: "filters" */ './SlicerFilter/SlicerFilter');
// const DateFilter = () => import(/* webpackChunkName: "filters" */ './DateFilter/DateFilter');
const DateFilter2 = () => import(/* webpackChunkName: "filters" */ './DateFilter/DateFilter2');
const InputFilter = () => import(/* webpackChunkName: "filters" */ './InputFilter/InputFilter');
const BulletGraph = () => import(/* webpackChunkName: "filters" */ './BulletGraph');
const LineStockChart = () => import(/* webpackChunkName: "filters" */ './LineStockChart');
const MeasureControl = () => import(/* webpackChunkName: "filters" */ './MeasureControl');

const ChartComponents = {
  install(Vue: typeof _Vue) {
    Vue.component('VueHighcharts', VueHighcharts);
    Vue.component('SeriesChart', SeriesChart);
    Vue.component('PieChart', PieChart);
    Vue.component('FunnelChart', FunnelChart);
    Vue.component('PyramidChart', PyramidChart);
    Vue.component('ScatterChart', ScatterChart);
    Vue.component('DrilldownChart', DrilldownChart);
    Vue.component('DrilldownPieChart', DrilldownPieChart);
    Vue.component('HeatMapChart', HeatMapChart);
    Vue.component('BubbleChart', BubbleChart);
    Vue.component('ParetoChart', ParetoChart);
    Vue.component('GaugeChart', GaugeChart);
    Vue.component('TreeMapChart', TreeMapChart);
    Vue.component('BellCurveChart', BellCurveChart);
    Vue.component('KPIWidget', KPIWidget);
    // Vue.component('TableChart', DefaultTable);
    Vue.component('WordCloudChart', WordCloudChart);
    Vue.component('StackingSeriesChart', StackingSeriesChart);
    Vue.component('HistogramChart', HistogramChart);
    Vue.component('MapChart', MapChart);
    Vue.component('ParliamentChart', ParliamentChart);
    Vue.component('DropdownFilter', DropdownFilter);
    Vue.component('TabFilter', TabFilter);
    Vue.component('SpiderWebChart', SpiderWebChart);
    Vue.component('BellCurve2Chart', BellCurve2Chart);
    Vue.component('SankeyChart', SankeyChart);
    Vue.component('SlicerFilter', SlicerFilter);
    // Vue.component('DateFilter', DateFilter);
    Vue.component('DateFilter2', DateFilter2);
    Vue.component('InputFilter', InputFilter);
    Vue.component('BulletGraph', BulletGraph);
    Vue.component('LineStockChart', LineStockChart);
    Vue.component('MeasureControl', MeasureControl);
  }
};

export default ChartComponents;
