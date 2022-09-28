import {
  BellCurveChartOption,
  BellCurveChartOption2,
  BubbleChartOption,
  BulletChartOption,
  ChartFamilyType,
  DateSelectFilterOption,
  DrilldownChartOption,
  DrilldownPieChartOption,
  DropdownChartOption,
  FlattenPivotTableChartOption,
  FlattenTableChartOption,
  FunnelChartOption,
  GaugeChartOption,
  GroupMeasurementOption,
  HeatMapChartOption,
  HistogramChartOption,
  InputControlOption,
  InputFilterOption,
  LineStockChartOption,
  MapChartChartOption,
  NumberChartOption,
  ParetoChartOption,
  ParliamentChartOption,
  PieChartOption,
  PivotTableChartOption,
  PyramidChartOption,
  SankeyChartOption,
  ScatterChartOption,
  SeriesChartOption,
  SlicerFilterOption,
  SpiderWebChartOption,
  StackedChartOption,
  TabFilterOption,
  TableChartOption,
  TreeMapChartOption,
  VizSettingType,
  WindRoseChartOption,
  WordCloudChartOption
} from '@core/domain/Model';
import { DIException } from '@core/domain/Exception';
import { ChartType } from '@/shared';
import { isString } from 'lodash';
import { ChartOptionData } from './ExtraSetting/ChartOptionData';
import { JsonUtils, Log, ObjectUtils } from '@core/utils';
import { _ThemeStore } from '@/store/modules/ThemeStore';

export type SettingKey = string;

export abstract class ChartOption<T extends ChartOptionData = ChartOptionData> {
  static readonly CHART_TYPE_CONVERT: Map<string, string> = new Map<string, string>([
    [ChartType.Bubble, 'bubble'],
    [ChartType.Pareto, ChartType.Column],
    [ChartType.BellCurve, ChartType.Scatter],
    [ChartType.Gauges, 'solidgauge'],
    [ChartType.ColumnDrillDown, ChartType.Column],
    [ChartType.BarDrillDown, ChartType.Bar],
    [ChartType.PieDrillDown, ChartType.Pie],
    [ChartType.Area, ChartType.AreaSpline],
    [ChartType.StackedLine, ChartType.Line],
    [ChartType.StackedColumn, ChartType.Column],
    [ChartType.StackedBar, ChartType.Bar],
    [ChartType.Histogram, ChartType.Column],
    [ChartType.Parliament, 'item'],
    [ChartType.SpiderWeb, 'line'],
    [ChartType.HeatMap, ChartType.HeatMap]
  ]);
  static readonly CONFIG = {
    themeColor: { enabled: true },
    // colors: ['#04C0C7', '#5144D3', '#E7871A', '#DA338F', '#9089FA', '#47E26F', '#2780EA', '#6F38B1', '#DEBF03', '#CB6F0F', '#278C6C'],
    chart: {
      backgroundColor: '',
      style: {
        fontFamily: 'Roboto'
      }
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true
    },
    legend: {
      itemMarginTop: 5,
      symbolHeight: 10,
      backgroundColor: '#00000000',
      navigation: {
        activeColor: 'var(--accent)',
        arrowSize: 10
      }
    },
    plotOptions: {
      // series: {
      //   borderWidth: 0,
      //   dataLabels: {
      //     enabled: false
      //   }
      // },
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false
        },
        showInLegend: true
      },
      scatter: {
        marker: {
          radius: 5,
          states: {
            hover: {
              enabled: true,
              lineColor: 'rgb(100,100,100)'
            }
          }
        },
        states: {
          hover: {
            marker: {
              enabled: false
            }
          }
        },
        solidgauge: {
          dataLabels: {
            y: 5,
            borderWidth: 0,
            useHTML: true
          }
        }
      },
      treemap: {
        borderColor: 'var(--secondary)',
        borderWidth: 0.5,
        dataLabels: {
          enabled: true,
          style: {
            textOutline: 0
          }
        }
      }
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    }
  };
  static readonly DRILL_DOWN_CONFIG = {
    drillUpButton: {
      position: {
        align: 'right'
      },
      theme: {
        fill: 'var(--transparent)',
        'stroke-width': 0.5,
        stroke: 'var(--primary)',
        r: 0,
        states: {
          hover: {
            fill: 'var(--primary)'
          },
          select: {
            stroke: 'var(--primary)',
            fill: 'var(--primary)'
          }
        }
      }
    },
    activeAxisLabelStyle: {
      color: 'var(--text-color)'
    }
  };
  static readonly DEFAULT_PALETTE_COLOR = [
    // '#04C0C7',
    // '#5144D3',
    // '#E7871A',
    // '#DA338F',
    // '#9089FA',
    // '#47E26F',
    // '#2780EA',
    // '#6F38B1',
    // '#DEBF03',
    // '#CB6F0F',
    // '#278C6C'
    '#2b908f',
    '#90ee7e',
    '#f45b5b',
    '#7798BF',
    '#aaeeee',
    '#ff0066',
    '#eeaaee',
    '#55BF3B',
    '#DF5353',
    '#7798BF',
    '#aaeeee'
  ];
  abstract readonly className: VizSettingType;
  abstract readonly chartFamilyType: ChartFamilyType;

  protected constructor(public readonly options: T) {}

  static fromObject(obj: ChartOption): ChartOption {
    switch (obj.className) {
      case VizSettingType.BellCurveSetting:
        return BellCurveChartOption.fromObject(obj as BellCurveChartOption);
      case VizSettingType.SeriesSetting:
        return SeriesChartOption.fromObject(obj as SeriesChartOption);
      case VizSettingType.PieSetting:
        return PieChartOption.fromObject(obj as PieChartOption);
      case VizSettingType.FunnelSetting:
        return FunnelChartOption.fromObject(obj as FunnelChartOption);
      case VizSettingType.PyramidSetting:
        return PyramidChartOption.fromObject(obj as PyramidChartOption);
      case VizSettingType.ScatterSetting:
        return ScatterChartOption.fromObject(obj as ScatterChartOption);
      case VizSettingType.BubbleSetting:
        return BubbleChartOption.fromObject(obj as BubbleChartOption);
      case VizSettingType.ParetoSetting:
        return ParetoChartOption.fromObject(obj as ParetoChartOption);
      case VizSettingType.HeatMapSetting:
        return HeatMapChartOption.fromObject(obj as HeatMapChartOption);
      case VizSettingType.GaugeSetting:
        return GaugeChartOption.fromObject(obj as GaugeChartOption);
      case VizSettingType.NumberSetting:
        return NumberChartOption.fromObject(obj as NumberChartOption);
      case VizSettingType.DrilldownSetting:
        return DrilldownChartOption.fromObject(obj as DrilldownChartOption);
      case VizSettingType.DrilldownPieSetting:
        return DrilldownPieChartOption.fromObject(obj as DrilldownPieChartOption);
      case VizSettingType.TableSetting:
        return TableChartOption.fromObject(obj);
      case VizSettingType.WordCloudSetting:
        return WordCloudChartOption.fromObject(obj as WordCloudChartOption);
      case VizSettingType.TreeMapSetting:
        return TreeMapChartOption.fromObject(obj as TreeMapChartOption);
      case VizSettingType.StackedSeriesSetting:
        return StackedChartOption.fromObject(obj as StackedChartOption);
      case VizSettingType.HistogramSetting:
        return HistogramChartOption.fromObject(obj as HistogramChartOption);
      case VizSettingType.DropdownSetting:
        return DropdownChartOption.fromObject(obj as DropdownChartOption);
      case VizSettingType.MapSetting:
        return MapChartChartOption.fromObject(obj as MapChartChartOption);
      case VizSettingType.TabFilterSetting:
        return TabFilterOption.fromObject(obj as TabFilterOption);
      case VizSettingType.PivotTableSetting:
        return PivotTableChartOption.fromObject(obj);
      case VizSettingType.ParliamentSetting:
        return ParliamentChartOption.fromObject(obj);
      case VizSettingType.SpiderWebSetting:
        return SpiderWebChartOption.fromObject(obj as SpiderWebChartOption);
      case VizSettingType.BellCurve2Setting:
        return BellCurveChartOption2.fromObject(obj as BellCurveChartOption2);
      case VizSettingType.SankeySetting:
        return SankeyChartOption.fromObject(obj as SankeyChartOption);
      case VizSettingType.SlicerFilterSetting:
        return SlicerFilterOption.fromObject(obj);
      case VizSettingType.DateSelectFilterSetting:
        return DateSelectFilterOption.fromObject(obj);
      case VizSettingType.FlattenTableSetting:
        return FlattenTableChartOption.fromObject(obj);
      case VizSettingType.FlattenPivotTableSetting:
        return FlattenPivotTableChartOption.fromObject(obj);
      case VizSettingType.InputFilterSetting:
        return InputFilterOption.fromObject(obj as InputFilterOption);
      case VizSettingType.BulletSetting:
        return BulletChartOption.fromObject(obj);
      case VizSettingType.WindRoseSetting:
        return WindRoseChartOption.fromObject(obj as WindRoseChartOption);
      case VizSettingType.LineStockSetting:
        return LineStockChartOption.fromObject(obj as LineStockChartOption);
      case VizSettingType.TabMeasurementSetting:
        return GroupMeasurementOption.fromObject(obj as GroupMeasurementOption);
      case VizSettingType.InputControlSetting:
        return InputControlOption.fromObject(obj as InputControlOption);
      default:
        throw new DIException(`ChartSetting:: ${obj.className} unsupported`);
    }
  }

  getBackgroundColor(): string {
    return this.options?.background ?? '#00000019';
  }

  getSubtitle(): string {
    if (isString(this.options?.subtitle)) {
      return this.options.subtitle;
    }
    return this.options?.subtitle?.text ?? '';
  }

  getSubtitleColor() {
    const defaultColor = '#fff';
    if (isString(this.options?.subtitle)) {
      return this.getTextColor() || defaultColor;
    }
    return this.options?.subtitle?.style?.color ?? defaultColor;
  }

  getSubtitleFontSize(): string {
    const defaultFontSize = '12px';
    if (isString(this.options?.subtitle)) {
      return defaultFontSize;
    }
    return this.options?.subtitle?.style?.fontSize ?? defaultFontSize;
  }

  getSubtitleAlign(): string {
    const defaultAlign = 'center';
    if (isString(this.options?.subtitle)) {
      return defaultAlign;
    }
    return this.options?.subtitle?.align ?? defaultAlign;
  }

  getTextColor(): string {
    return this.options?.textColor ?? '#fff';
  }

  getTitle(): string {
    if (isString(this.options?.title)) {
      return this.options.title;
    }
    return this.options?.title?.text ?? '';
  }

  setTitle(title: string): void {
    if (isString(this.options.title)) {
      Object.assign(this.options, { title: title });
    } else {
      JsonUtils.mergeDeep(this.options, {
        title: {
          text: title
        }
      });
    }
  }

  getTitleColor() {
    const defaultColor = '#fff';
    if (isString(this.options?.title)) {
      return this.getTextColor() || defaultColor;
    }
    return this.options?.title?.style?.color ?? defaultColor;
  }

  getTitleFontSize(): string {
    const defaultFontSize = '20px';
    if (isString(this.options?.title)) {
      return defaultFontSize;
    }
    return this.options?.title?.style?.fontSize ?? defaultFontSize;
  }

  getTitleAlign(): string {
    const defaultAlign = 'center';
    if (isString(this.options?.title)) {
      return defaultAlign;
    }
    return this.options.title?.align ?? defaultAlign;
  }

  isAffectedByFilter(): boolean {
    return this.options?.affectedByFilter ?? true;
  }

  isEnableDrilldown(): boolean {
    return this.options?.isEnableDrilldown ?? false;
  }

  isEnableZoom(): boolean {
    return this.options?.isEnableZoom ?? false;
  }

  get colors(): string[] {
    if (this.options.themeColor?.enabled ?? true) {
      return _ThemeStore.paletteColors;
    }
    return this.options.themeColor?.colors ?? [];
  }

  setOption(key: string, value: any) {
    ObjectUtils.set(this.options, key, value);
  }

  removeOption(key: string): void {
    ObjectUtils.set(this.options, key, void 0);
  }

  setOptions(settingAsMap: Map<SettingKey, boolean | string | number>) {
    settingAsMap.forEach((value, key) => {
      ObjectUtils.set(this.options, key, value);
    });
  }

  static getDefaultChartOption(chartType: ChartType) {
    Log.debug('getDefaultChartOption::', chartType);
    switch (chartType) {
      case ChartType.BellCurve:
        return BellCurveChartOption2.getDefaultChartOption();
      case ChartType.Line:
      case ChartType.Bar:
      case ChartType.Area:
      case ChartType.AreaSpline:
      case ChartType.Column:
      case ChartType.Lollipop:
        return SeriesChartOption.getDefaultChartOption(chartType);
      case ChartType.Pie:
        return PieChartOption.getDefaultChartOption();
      case ChartType.Funnel:
        return FunnelChartOption.getDefaultChartOption();
      case ChartType.Pyramid:
        return PyramidChartOption.getDefaultChartOption();
      case ChartType.Scatter:
        return ScatterChartOption.getDefaultChartOption();
      case ChartType.Bubble:
        return BubbleChartOption.getDefaultChartOption();
      case ChartType.Pareto:
        return ParetoChartOption.getDefaultChartOption();
      case ChartType.HeatMap:
        return HeatMapChartOption.getDefaultChartOption();
      case ChartType.Gauges:
        return GaugeChartOption.getDefaultChartOption();
      case ChartType.Kpi:
        return NumberChartOption.getDefaultChartOption();
      case ChartType.ColumnDrillDown:
      case ChartType.BarDrillDown:
        return DrilldownChartOption.getDefaultChartOption();
      case ChartType.PieDrillDown:
        return DrilldownPieChartOption.getDefaultChartOption();
      case ChartType.Table:
        return TableChartOption.getDefaultChartOption();
      case ChartType.WordCloud:
        return WordCloudChartOption.getDefaultChartOption();
      case ChartType.TreeMap:
        return TreeMapChartOption.getDefaultChartOption();
      case ChartType.StackedBar:
      case ChartType.StackedColumn:
      case ChartType.StackedLine:
        return StackedChartOption.getDefaultChartOption(chartType);
      case ChartType.Histogram:
        return HistogramChartOption.getDefaultChartOption();
      case ChartType.Map:
        return MapChartChartOption.getDefaultChartOption();
      case ChartType.TabFilter:
      case ChartType.SingleChoice:
      case ChartType.MultiChoice:
      case ChartType.DropDown:
      case ChartType.SingleChoiceFilter: ///Inner Filter
      case ChartType.MultiChoiceFilter:
      case ChartType.TabInnerFilter:
      case ChartType.DropDownFilter:
        return TabFilterOption.getDefaultChartOption(chartType);
      case ChartType.PivotTable:
        return PivotTableChartOption.getDefaultChartOption();
      case ChartType.Parliament:
        return ParliamentChartOption.getDefaultChartOption();
      case ChartType.SpiderWeb:
        return SpiderWebChartOption.getDefaultChartOption();
      case ChartType.Sankey:
        return SankeyChartOption.getDefaultChartOption();
      case ChartType.SlicerFilter:
        return SlicerFilterOption.getDefaultChartOption();
      case ChartType.DateSelectFilter:
        return DateSelectFilterOption.getDefaultChartOption();
      case ChartType.FlattenTable:
        return FlattenTableChartOption.getDefaultChartOption();
      case ChartType.FlattenPivotTable:
        return FlattenPivotTableChartOption.getDefaultChartOption();
      case ChartType.InputFilter:
        return InputFilterOption.getDefaultChartOption();
      case ChartType.Bullet:
        return BulletChartOption.getDefaultChartOption();
      case ChartType.WindRose:
        return WindRoseChartOption.getDefaultChartOption();
      case ChartType.LineStock:
        return LineStockChartOption.getDefaultChartOption(chartType);
      case ChartType.TabMeasurement:
      case ChartType.MultiChoiceMeasurement:
      case ChartType.SingleChoiceMeasurement:
      case ChartType.DropDownMeasurement:
        return GroupMeasurementOption.getDefaultChartOption(chartType);
      case ChartType.InputControl:
        return InputControlOption.getDefaultChartOption();
      default:
        throw new DIException(`getDefaultChartOption:: ${ChartType} unsupported`);
    }
  }

  static getHighchartType(chartType: ChartType) {
    switch (chartType) {
      case ChartType.StackedBar:
        return ChartType.Bar;
      case ChartType.StackedColumn:
        return ChartType.Column;
      case ChartType.Bubble:
        return 'bubble';
      case ChartType.Pareto:
        return ChartType.Column;
      case ChartType.BellCurve:
        return ChartType.Scatter;
      case ChartType.Gauges:
        return 'solidgauge';
      case ChartType.Area:
        return ChartType.AreaSpline;
      case ChartType.Histogram:
        return ChartType.Column;
      case ChartType.Parliament:
        return 'item';
      case ChartType.SpiderWeb:
        return 'line';
      case ChartType.WindRose:
        return 'column';
      case ChartType.LineStock:
        return 'line';
      default:
        return chartType;
    }
  }

  static getThemeTextColor(): string {
    return 'var(--text-color)';
  }

  static getThemeSecondaryTextColor(): string {
    return 'var(--secondary-text-color)';
  }

  static getGridLineColor(): string {
    return 'var(--grid-line-color)';
  }

  static getTableGridLineColor(): string {
    return 'var(--table-grid-line-color)';
  }

  static getTableHeaderBackgroundColor(): string {
    return 'var(--header-background-color)';
  }

  static getTableTotalColor(): string {
    return 'var(--total-background-color)';
  }

  static getTableToggleColor(): string {
    return 'var(--toggle-color)';
  }

  static getThemeBackgroundColor(): string {
    return 'var(--chart-background-color)';
  }

  static getTooltipBackgroundColor(): string {
    return 'var(--tooltip-background-color)';
  }
}
