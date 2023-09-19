import {
  BellCurveChartOption,
  BellCurveChartOption2,
  BubbleChartOption,
  BulletChartOption,
  ChartOptionClassName,
  CircularChartOption,
  DateSelectFilterOption,
  DonutChartOption,
  DrilldownChartOption,
  DrilldownPieChartOption,
  DropdownChartOption,
  FlattenPivotTableChartOption,
  FlattenTableChartOption,
  FunnelChartOption,
  GaugeChartOption,
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
  StyleSetting,
  TabFilterOption,
  TableChartOption,
  TextSetting,
  TreeFilterOption,
  TreeMapChartOption,
  ValueControlInfo,
  ValueController,
  ValueControlType,
  VariablepieChartOption,
  WindRoseChartOption,
  WordCloudChartOption
} from '@core/common/domain/model';
import { DIException } from '@core/common/domain/exception';
import { ChartType } from '@/shared';
import { isString } from 'lodash';
import { ChartOptionData } from './extra-setting/ChartOptionData';
import { Log, ObjectUtils } from '@core/utils';
import { _ThemeStore } from '@/store/modules/ThemeStore';

export type SettingKey = string;

export abstract class ChartOption<T extends ChartOptionData = ChartOptionData> implements ValueController {
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
      },
      spacing: [4, 0, 0, 0]
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
      },
      legend: {
        padding: 0
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
    title: {
      style: {
        color: ChartOption.getPrimaryTextColor(),
        fontFamily: ChartOption.getPrimaryFontFamily(),
        fontWeight: ChartOption.getPrimaryFontWeight(),
        fontStyle: ChartOption.getPrimaryFontStyle()
      }
    },
    subtitle: {
      style: ChartOption.getSecondaryStyle()
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
  abstract readonly className: ChartOptionClassName;

  protected constructor(public readonly options: T) {}

  static fromObject(obj: ChartOption): ChartOption {
    switch (obj.className) {
      case ChartOptionClassName.BellCurveSetting:
        return BellCurveChartOption.fromObject(obj as BellCurveChartOption);
      case ChartOptionClassName.SeriesSetting:
        return SeriesChartOption.fromObject(obj as SeriesChartOption);
      case ChartOptionClassName.PieSetting:
        return PieChartOption.fromObject(obj as PieChartOption);
      case ChartOptionClassName.FunnelSetting:
        return FunnelChartOption.fromObject(obj as FunnelChartOption);
      case ChartOptionClassName.PyramidSetting:
        return PyramidChartOption.fromObject(obj as PyramidChartOption);
      case ChartOptionClassName.ScatterSetting:
        return ScatterChartOption.fromObject(obj as ScatterChartOption);
      case ChartOptionClassName.BubbleSetting:
        return BubbleChartOption.fromObject(obj as BubbleChartOption);
      case ChartOptionClassName.ParetoSetting:
        return ParetoChartOption.fromObject(obj as ParetoChartOption);
      case ChartOptionClassName.HeatMapSetting:
        return HeatMapChartOption.fromObject(obj as HeatMapChartOption);
      case ChartOptionClassName.GaugeSetting:
        return GaugeChartOption.fromObject(obj as GaugeChartOption);
      case ChartOptionClassName.NumberSetting:
        return NumberChartOption.fromObject(obj as NumberChartOption);
      case ChartOptionClassName.DrilldownSetting:
        return DrilldownChartOption.fromObject(obj as DrilldownChartOption);
      case ChartOptionClassName.DrilldownPieSetting:
        return DrilldownPieChartOption.fromObject(obj as DrilldownPieChartOption);
      case ChartOptionClassName.TableSetting:
        return TableChartOption.fromObject(obj);
      case ChartOptionClassName.WordCloudSetting:
        return WordCloudChartOption.fromObject(obj as WordCloudChartOption);
      case ChartOptionClassName.TreeMapSetting:
        return TreeMapChartOption.fromObject(obj as TreeMapChartOption);
      case ChartOptionClassName.StackedSeriesSetting:
        return StackedChartOption.fromObject(obj as StackedChartOption);
      case ChartOptionClassName.CircularBarSetting:
        return CircularChartOption.fromObject(obj as CircularChartOption);
      case ChartOptionClassName.HistogramSetting:
        return HistogramChartOption.fromObject(obj as HistogramChartOption);
      case ChartOptionClassName.DropdownSetting:
        return DropdownChartOption.fromObject(obj as DropdownChartOption);
      case ChartOptionClassName.MapSetting:
        return MapChartChartOption.fromObject(obj as MapChartChartOption);
      case ChartOptionClassName.TabFilterSetting:
        return TabFilterOption.fromObject(obj as TabFilterOption);
      case ChartOptionClassName.PivotTableSetting:
        return PivotTableChartOption.fromObject(obj);
      case ChartOptionClassName.ParliamentSetting:
        return ParliamentChartOption.fromObject(obj);
      case ChartOptionClassName.SpiderWebSetting:
        return SpiderWebChartOption.fromObject(obj as SpiderWebChartOption);
      case ChartOptionClassName.BellCurve2Setting:
        return BellCurveChartOption2.fromObject(obj as BellCurveChartOption2);
      case ChartOptionClassName.SankeySetting:
        return SankeyChartOption.fromObject(obj as SankeyChartOption);
      case ChartOptionClassName.SlicerFilterSetting:
        return SlicerFilterOption.fromObject(obj);
      case ChartOptionClassName.DateSelectFilterSetting:
        return DateSelectFilterOption.fromObject(obj);
      case ChartOptionClassName.FlattenTableSetting:
        return FlattenTableChartOption.fromObject(obj);
      case ChartOptionClassName.FlattenPivotTableSetting:
        return FlattenPivotTableChartOption.fromObject(obj);
      case ChartOptionClassName.InputFilterSetting:
        return InputFilterOption.fromObject(obj as InputFilterOption);
      case ChartOptionClassName.BulletSetting:
        return BulletChartOption.fromObject(obj);
      case ChartOptionClassName.WindRoseSetting:
        return WindRoseChartOption.fromObject(obj as WindRoseChartOption);
      case ChartOptionClassName.LineStockSetting:
        return LineStockChartOption.fromObject(obj as LineStockChartOption);
      case ChartOptionClassName.InputControlSetting:
        return InputControlOption.fromObject(obj as InputControlOption);
      case ChartOptionClassName.TreeFilterSetting:
        return TreeFilterOption.fromObject(obj as TreeFilterOption);
      case ChartOptionClassName.VariablePieSetting:
        return VariablepieChartOption.fromObject(obj as VariablepieChartOption);
      case ChartOptionClassName.DonutSetting:
        return DonutChartOption.fromObject(obj as DonutChartOption);
      default:
        throw new DIException(`ChartSetting:: ${obj.className} unsupported`);
    }
  }

  getBackgroundColor(): string {
    return this.options?.background ?? '#FAFAFB';
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
      ObjectUtils.set(this.options, 'title.text', title);
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
      case ChartType.CircularBar:
        return CircularChartOption.getDefaultChartOption();
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
      case ChartType.InputControl:
        return InputControlOption.getDefaultChartOption();
      case ChartType.MultiTreeFilter:
      case ChartType.SingleTreeFilter:
        return TreeFilterOption.getDefaultChartOption(chartType);
      case ChartType.Variablepie:
        return VariablepieChartOption.getDefaultChartOption();
      case ChartType.Donut:
        return DonutChartOption.getDefaultChartOption();
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
      case ChartType.CircularBar:
      case ChartType.WindRose:
        return 'column';
      case ChartType.LineStock:
        return 'line';
      default:
        return chartType;
    }
  }

  static getDefaultTitle(custom: { title?: string; align?: AlignSetting; fontSize?: string } = {}): TextSetting {
    return {
      align: custom.align ?? 'center',
      enabled: true,
      text: custom.title ?? 'Untitled chart',
      style: {
        color: ChartOption.getPrimaryTextColor(),
        fontFamily: ChartOption.getPrimaryFontFamily(),
        fontSize: custom.fontSize ?? '20px',
        fontWeight: ChartOption.getPrimaryFontWeight(),
        fontStyle: ChartOption.getPrimaryFontStyle()
      }
    } as TextSetting;
  }

  static getDefaultSubtitle(custom: { content?: string; align?: AlignSetting; fontSize?: string } = {}): TextSetting {
    return {
      align: custom.align ?? 'center',
      enabled: true,
      text: custom.content ?? '',
      style: ChartOption.getSecondaryStyle({ fontSize: custom.fontSize, isEnableDecoration: true })
    } as TextSetting;
  }

  static getSecondaryStyle(custom: { fontSize?: string; isEnableDecoration?: boolean } = {}): StyleSetting {
    return {
      color: ChartOption.getSecondaryTextColor(),
      fontFamily: ChartOption.getSecondaryFontFamily(),
      fontSize: custom.fontSize ?? '11px',
      fontWeight: ChartOption.getSecondaryFontWeight(),
      fontStyle: ChartOption.getSecondaryFontStyle(),
      textDecoration: custom.isEnableDecoration ? ChartOption.getSecondaryFontUnderlined() : void 0
    };
  }

  static getPrimaryTextColor(): string {
    return 'var(--text-color)';
  }

  static getSecondaryTextColor(): string {
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

  static getPrimaryFontFamily(): string {
    return `var(--widget-primary-font-family, Roboto)`;
  }

  static getPrimaryFontWeight(): string {
    return `var(--widget-primary-font-weight, 500)`;
  }

  static getPrimaryFontStyle(): string {
    return `var(--widget-primary-font-style, normal)`;
  }

  static getPrimaryFontUnderlined(): string {
    return `var(--widget-primary-font-underlined, underline)`;
  }

  static getPrimaryFontAlign(): string {
    return `var(--widget-primary-font-align, center)`;
  }

  static getSecondaryFontFamily(): string {
    return `var(--widget-secondary-font-family, Roboto)`;
  }

  static getSecondaryFontWeight(): string {
    return `var(--widget-secondary-font-weight, 400)`;
  }

  static getSecondaryFontStyle(): string {
    return `var(--widget-secondary-font-style, normal)`;
  }

  static getSecondaryFontUnderlined(): string {
    return `var(--widget-secondary-font-underlined, underline)`;
  }

  static getSecondaryFontAlign(): string {
    return `var(--widget-secondary-font-align, center)`;
  }

  isEnableControl(): boolean {
    return true;
  }

  getSupportedControls(): ValueControlInfo[] {
    return [new ValueControlInfo(ValueControlType.SelectedValue, 'Selected Value')];
  }

  getDefaultValueAsMap(): Map<ValueControlType, string[]> | undefined {
    return undefined;
  }

  /**
   * Control logic keep value of this object and merge otherOption if can.
   * @return {ChartOption} is a new instance of this object and otherOption is merged into it.
   * default implementation is keep title of other object & return clone of this object.
   * Implement this method if you want to keep other value for specific chart type.
   */
  mergeWith(otherOption: ChartOption): ChartOption {
    this.setTitle(otherOption.getTitle() || this.getTitle());
    return this;
  }

  getOverridePadding(): string | undefined {
    return void 0;
  }
}
