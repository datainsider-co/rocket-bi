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
import Dumbbell from 'highcharts/modules/dumbbell';
import DependencyWheel from 'highcharts/modules/dependency-wheel';
import Bullet from 'highcharts/modules/bullet';
import VariablePie from 'highcharts/modules/variable-pie';

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
Dumbbell(Highcharts);
Lollipop(Highcharts);
DependencyWheel(Highcharts);
Bullet(Highcharts);
VariablePie(Highcharts);
// Exporting(Highcharts);
// import DropdownFilter from '@chart/DropdownFilter';
// import HeatMapChart from '@chart/HeatMapChart';

const SeriesChart = () => import('./SeriesChart');
const PieChart = () => import('./PieChart');
const FunnelChart = () => import('./FunnelChart');
const PyramidChart = () => import('./PyramidChart');
const ScatterChart = () => import('./ScatterChart');
const DrilldownChart = () => import('./DrilldownChart');
const DrilldownPieChart = () => import('./DrilldownPieChart');
const HeatMapChart = () => import('./HeatMapChart');
const BubbleChart = () => import('./BubbleChart');
const ParetoChart = () => import('./ParetoChart');
const HistogramChart = () => import('./HistogramChart');
const BellCurveChart = () => import('./BellCurveChart');
const BellCurve2Chart = () => import('./BellCurve2Chart');
const GaugeChart = () => import('./GaugeChart');
const TreeMapChart = () => import('./TreeMapChart');
// const HighchartsTreeMapLevelChart = () => import( './TreeMapLevelChart.js');
const KPIWidget = () => import('./number-widget/NumberWidget');
// const TableChart = () => import( './TableChart/TableChart');
const WordCloudChart = () => import('./WordCloudChart');
const StackingSeriesChart = () => import('./StackingSeriesChart');
const MapChart = () => import('./MapChart');
const ParliamentChart = () => import('./ParliamentChart');

const DropdownFilter = () => import('./DropdownFilter');
const TabFilter = () => import('./TabFilter');
const SpiderWebChart = () => import('./SpiderWebChart');
const SankeyChart = () => import('./SankeyChart');
const SlicerFilter = () => import('./slicer-filter/SlicerFilter');
// const DateFilter = () => import( './DateFilter/DateFilter');
const DateFilter2 = () => import('./date-filter/DateFilter2');
const InputFilter = () => import('./input-filter/InputFilter');
const BulletGraph = () => import('./BulletGraph');
const LineStockChart = () => import('./LineStockChart');
const TreeFilter = () => import('./TreeFilter');
const DonutChart = () => import('./DonutChart');
const VariablepieChart = () => import('./VariablepieChart');
const GenericChart = () => import('./GenericChart');

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
    Vue.component('TreeFilter', TreeFilter);
    Vue.component('DonutChart', DonutChart);
    Vue.component('VariablepieChart', VariablepieChart);
    Vue.component('GenericChart', GenericChart);
  }
};

export default ChartComponents;
