import {
  AggregationFunctionTypes,
  ChartType,
  ConditionFamilyTypes,
  ConditionNode,
  DateFunctionTypes,
  DateHistogramConditionTypes,
  DraggableConfig,
  FunctionFamilyTypes,
  FunctionNode,
  LabelNode,
  NumberConditionTypes,
  SortTypes,
  StringConditionTypes,
  VisualizationItemData
} from '@/shared';

export class FunctionFamilyInfo {
  family: string;
  type: string;

  constructor(family: string, type?: string) {
    this.family = family;
    this.type = type ?? '';
  }
}

export enum ConfigType {
  xAxis = 'xAxis',
  yAxis = 'yAxis',
  legend = 'legend',
  legendOptional = 'legendOptional',
  legends = 'legends',
  value = 'value',
  values = 'values',
  columns = 'columns',
  rows = 'rows',
  label = 'label',
  location = 'location',
  breakdownOptional = 'breakdownOptional',
  ///source, destination,breakdowns, weight using for sankey chart
  source = 'source',
  breakdowns = 'breakdowns',
  destination = 'destination',
  weight = 'weight',

  filters = 'filters',
  sorting = 'sorting',
  tooltips = 'tooltips'
}

const GROUP_FUNCTION_FOR_TEXT = new FunctionFamilyInfo(FunctionFamilyTypes.groupBy);
const GROUP_FUNCTION_FOR_DATE = new FunctionFamilyInfo(FunctionFamilyTypes.dateHistogram, DateFunctionTypes.year);
const GROUP_FUNCTION_FOR_NUMBER = new FunctionFamilyInfo(FunctionFamilyTypes.groupBy);

const NONE_FUNCTION_FOR_TEXT = new FunctionFamilyInfo(FunctionFamilyTypes.none);
const NONE_FUNCTION_FOR_DATE = new FunctionFamilyInfo(FunctionFamilyTypes.none);
const NONE_FUNCTION_FOR_NUMBER = new FunctionFamilyInfo(FunctionFamilyTypes.none);

const AGGREGATION_FUNCTION_FOR_TEXT = new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countAll);
const AGGREGATION_FUNCTION_FOR_DATE = new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countAll);
const AGGREGATION_FUNCTION_FOR_NUMBER = new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.sum);

const AGGREGATION_FUNCTION_FOR_MEASURE = new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.Expression);

export abstract class DataBuilderConstants {
  static readonly TEXT_FUNCTION_NODES: FunctionNode[] = [
    {
      label: FunctionFamilyTypes.groupBy
    },
    {
      label: FunctionFamilyTypes.dateHistogram,
      subFunctions: [
        {
          type: 'group',
          label: 'Continuous',
          options: [
            { label: DateFunctionTypes.secondOf },
            { label: DateFunctionTypes.minuteOf },
            { label: DateFunctionTypes.hourOf },
            { label: DateFunctionTypes.dayOf },
            { label: DateFunctionTypes.weekOf },
            { label: DateFunctionTypes.monthOf },
            { label: DateFunctionTypes.quarterOf },
            { label: DateFunctionTypes.yearlyOf }
          ]
        },
        {
          type: 'group',
          label: 'Periodic',
          options: [
            { label: DateFunctionTypes.year },
            { label: DateFunctionTypes.quarterOfYear },
            { label: DateFunctionTypes.monthOfYear },
            { label: DateFunctionTypes.dayOfYear },
            { label: DateFunctionTypes.dayOfMonth },
            { label: DateFunctionTypes.dayOfWeek },
            { label: DateFunctionTypes.hourOfDay },
            { label: DateFunctionTypes.minuteOfHour },
            { label: DateFunctionTypes.secondOfMinute }
            // { label: FUNCTION_DATE_TYPE.DYNAMIC }
          ]
        },
        {
          type: 'group',
          label: 'Timestamp',
          options: [{ label: DateFunctionTypes.second }, { label: DateFunctionTypes.millisecond }, { label: DateFunctionTypes.nanosecond }]
        }
      ]
    },
    {
      label: FunctionFamilyTypes.aggregation,
      subFunctions: [
        {
          label: AggregationFunctionTypes.countOfDistinct
        },
        { label: AggregationFunctionTypes.countAll }
      ]
    },
    {
      label: FunctionFamilyTypes.none
    }
  ];
  static readonly NUMBER_FUNCTION_NODES: FunctionNode[] = [
    {
      label: FunctionFamilyTypes.groupBy
    },
    {
      label: FunctionFamilyTypes.dateHistogram,
      subFunctions: [
        {
          type: 'group',
          label: 'Continuous',
          options: [
            { label: DateFunctionTypes.secondOf },
            { label: DateFunctionTypes.minuteOf },
            { label: DateFunctionTypes.hourOf },
            { label: DateFunctionTypes.dayOf },
            { label: DateFunctionTypes.weekOf },
            { label: DateFunctionTypes.monthOf },
            { label: DateFunctionTypes.quarterOf },
            { label: DateFunctionTypes.yearlyOf }
          ]
        },
        {
          type: 'group',
          label: 'Periodic',
          options: [
            { label: DateFunctionTypes.year },
            { label: DateFunctionTypes.quarterOfYear },
            { label: DateFunctionTypes.monthOfYear },
            { label: DateFunctionTypes.dayOfYear },
            { label: DateFunctionTypes.dayOfMonth },
            { label: DateFunctionTypes.dayOfWeek },
            { label: DateFunctionTypes.hourOfDay },
            { label: DateFunctionTypes.minuteOfHour },
            { label: DateFunctionTypes.secondOfMinute }
            // { label: FUNCTION_DATE_TYPE.DYNAMIC }
          ]
        },
        {
          type: 'group',
          label: 'Timestamp',
          options: [{ label: DateFunctionTypes.second }, { label: DateFunctionTypes.millisecond }, { label: DateFunctionTypes.nanosecond }]
        }
      ]
    },
    {
      label: FunctionFamilyTypes.aggregation,
      subFunctions: [
        { label: AggregationFunctionTypes.average },
        {
          label: AggregationFunctionTypes.sum
        },
        { label: AggregationFunctionTypes.maximum },
        { label: AggregationFunctionTypes.minimum },
        {
          label: AggregationFunctionTypes.countOfDistinct
        },
        { label: AggregationFunctionTypes.countAll }
      ]
    },
    // {
    //   label:FUNCTION_FAMILY.CUSTOM
    // },
    {
      label: FunctionFamilyTypes.none
    }
  ];
  static readonly DATE_FUNCTION_NODES: FunctionNode[] = [
    {
      label: FunctionFamilyTypes.groupBy
    },
    {
      label: FunctionFamilyTypes.dateHistogram,
      subFunctions: [
        {
          type: 'group',
          label: 'Continuous',
          options: [
            { label: DateFunctionTypes.secondOf },
            { label: DateFunctionTypes.minuteOf },
            { label: DateFunctionTypes.hourOf },
            { label: DateFunctionTypes.dayOf },
            { label: DateFunctionTypes.weekOf },
            { label: DateFunctionTypes.monthOf },
            { label: DateFunctionTypes.quarterOf },
            { label: DateFunctionTypes.yearlyOf }
          ]
        },
        {
          type: 'group',
          label: 'Periodic',
          options: [
            { label: DateFunctionTypes.year },
            { label: DateFunctionTypes.quarterOfYear },
            { label: DateFunctionTypes.monthOfYear },
            { label: DateFunctionTypes.dayOfYear },
            { label: DateFunctionTypes.dayOfMonth },
            { label: DateFunctionTypes.dayOfWeek },
            { label: DateFunctionTypes.hourOfDay },
            { label: DateFunctionTypes.minuteOfHour },
            { label: DateFunctionTypes.secondOfMinute }
            // { label: FUNCTION_DATE_TYPE.DYNAMIC }
          ]
        },
        {
          type: 'group',
          label: 'Timestamp',
          options: [{ label: DateFunctionTypes.second }, { label: DateFunctionTypes.millisecond }, { label: DateFunctionTypes.nanosecond }]
        }
      ]
    },
    {
      label: FunctionFamilyTypes.aggregation,
      subFunctions: [
        {
          label: AggregationFunctionTypes.countOfDistinct
        },
        { label: AggregationFunctionTypes.countAll }
      ]
    },
    {
      label: FunctionFamilyTypes.none
    }
  ];

  static readonly EXPRESSION_FUNCTION_NODES: FunctionNode[] = [
    {
      label: FunctionFamilyTypes.aggregation,
      subFunctions: [
        {
          label: AggregationFunctionTypes.Expression
        }
      ]
    }
  ];

  static readonly FILTER_NODES: ConditionNode[] = [
    {
      label: ConditionFamilyTypes.dateHistogram,
      conditions: [
        {
          type: 'group',
          label: 'Activity Date',
          options: [
            {
              label: DateHistogramConditionTypes.earlierThan,
              values: ['d']
            },
            {
              label: DateHistogramConditionTypes.laterThan,
              values: ['d']
            },
            {
              label: DateHistogramConditionTypes.between,
              values: ['d', 'd']
            },
            {
              label: DateHistogramConditionTypes.betweenAndIncluding,
              values: ['d', 'd']
            }
          ]
        },
        {
          type: 'group',
          label: 'Relative Date',
          options: [
            {
              label: DateHistogramConditionTypes.lastNMinutes,
              values: ['n']
            },
            {
              label: DateHistogramConditionTypes.lastNHours,
              values: ['n']
            },
            {
              label: DateHistogramConditionTypes.lastNDays,
              values: ['n']
            },
            {
              label: DateHistogramConditionTypes.lastNWeeks,
              values: ['n']
            },
            {
              label: DateHistogramConditionTypes.lastNMonths,
              values: ['n']
            },
            {
              label: DateHistogramConditionTypes.lastNYears,
              values: ['n']
            }
          ]
        },
        // {
        //   type: 'group',
        //   label: 'Between Dates',
        //   options: [
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_MINUTES_BEFORE_NOW,
        //       values: ['n', 'n']
        //     },
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_HOURS_BEFORE_NOW,
        //       values: ['n', 'n']
        //     },
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_DAYS_BEFORE_NOW,
        //       values: ['n', 'n']
        //     },
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_WEEKS_BEFORE_NOW,
        //       values: ['n', 'n']
        //     },
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_MONTHS_BEFORE_NOW,
        //       values: ['n', 'n']
        //     },
        //     {
        //       label: CONDITION_DATE_HISTOGRAMS.BETWEEN_N_M_YEARS_BEFORE_NOW,
        //       values: ['n', 'n']
        //     }
        //   ]
        // },
        {
          type: 'group',
          label: 'Current Date',
          options: [
            { label: DateHistogramConditionTypes.currentDay },
            { label: DateHistogramConditionTypes.currentWeek },
            { label: DateHistogramConditionTypes.currentMonth },
            { label: DateHistogramConditionTypes.currentQuarter },
            { label: DateHistogramConditionTypes.currentYear }
          ]
        }
      ]
    },
    {
      label: ConditionFamilyTypes.number,
      conditions: [
        {
          label: NumberConditionTypes.equal
        },
        {
          label: NumberConditionTypes.notEqual
        },
        {
          label: NumberConditionTypes.greaterThan
        },
        {
          label: NumberConditionTypes.greaterThanOrEqual
        },
        {
          label: NumberConditionTypes.lessThan
        },
        {
          label: NumberConditionTypes.lessThanOrEqual
        },
        {
          label: NumberConditionTypes.between,
          value: ['n', 'm']
        },
        {
          label: NumberConditionTypes.betweenAndIncluding,
          value: ['n', 'm']
        }
      ]
    },
    {
      label: ConditionFamilyTypes.string,
      conditions: [
        {
          type: 'group',
          label: 'Exact match',
          options: [
            { label: StringConditionTypes.equal },
            { label: StringConditionTypes.notEqual }
            // { label: CONDITION_STRINGS.IS_ONE_OF },
            // { label: CONDITION_STRINGS.IS_NOT_ONE_OF }
          ]
        },
        {
          type: 'group',
          label: 'Present',
          options: [{ label: StringConditionTypes.isnull }, { label: StringConditionTypes.notNull }]
        },
        {
          type: 'group',
          label: 'Pattern match',
          options: [
            { label: StringConditionTypes.like },
            { label: StringConditionTypes.notLike },
            { label: StringConditionTypes.matchesRegex },
            { label: StringConditionTypes.likeCaseInsensitive },
            { label: StringConditionTypes.notLikeCaseInsensitive }
          ]
        }
      ]
    }
    // {
    //   label: FILTER_FAMILY.GEOSPATIAL,
    //   conditions: [
    //     { label: CONDITION_GEOSPATIAL.COUNTRY_OF },
    //     { label: CONDITION_GEOSPATIAL.CITY_OF },
    //     { label: CONDITION_GEOSPATIAL.STATE_OF },
    //     { label: CONDITION_GEOSPATIAL.DISTRICT_OF },
    //     { label: CONDITION_GEOSPATIAL.LONG_LAST_OF }
    //   ]
    // },
    // {
    //   label: FILTER_FAMILY.CUSTOM
    // }
  ];

  static readonly SortOptions: LabelNode[] = [{ label: SortTypes.Unsorted }, { label: SortTypes.AscendingOrder }, { label: SortTypes.DescendingOrder }];
}

export abstract class DataBuilderConstantsV35 {
  static get ALL_ITEMS(): VisualizationItemData[] {
    return [...DataBuilderConstantsV35.ALL_CHARTS, ...DataBuilderConstantsV35.ALL_FILTERS].filter(item => !item.isHidden);
  }

  static get ALL_ITEMS_AS_MAP(): Map<string, VisualizationItemData> {
    return new Map<string, VisualizationItemData>(DataBuilderConstantsV35.ALL_ITEMS.map(vizItem => [vizItem.type, vizItem]));
  }

  static readonly LINE_STOCK_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];

  static readonly TAB_MEASUREMENT_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.values,
      title: 'Values',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];
  static readonly DROP_DOWN_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.values,
      title: 'Values',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.aggregation, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];
  static readonly VALUE_FILTER_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation, FunctionFamilyTypes.groupBy],
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT
    }
  ];

  static readonly FILTER_CONFIGS: any[] = [
    {
      key: ConfigType.filters,
      title: 'Filters',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [],
      isOptional: true
    },
    {
      key: ConfigType.sorting,
      title: 'Sorting',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [],
      isOptional: true
    }
    // {
    //   key: ConfigType.tooltips,
    //   title: 'Tooltips',
    //   placeholder: 'Drag and drop field here to tooltips your data'
    // }
  ];
  static readonly GAUGE_FILTER_CONFIGS: any[] = [
    {
      key: ConfigType.filters,
      title: 'Filters',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [],
      isOptional: true
    }
  ];
  static readonly BELL_CURVE_EXTRA_CONFIGS: any[] = [
    {
      key: ConfigType.filters,
      title: 'Filters',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [],
      isOptional: true
    }
    // {
    //   key: ConfigType.sorting,
    //   title: 'Sorting',
    //   placeholder: 'Drag and drop your fields',
    //   preferFunctionTypes: [],
    //   isOptional: true
    // }
    // {
    //   key: ConfigType.tooltips,
    //   title: 'Tooltips',
    //   placeholder: 'Drag and drop field here to tooltips your data'
    // }
  ];

  static readonly SERIES_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];
  //Bar chart swap X-Axis's title and Y-Axis's title to display, but key is not change
  static readonly BAR_SERIES_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];

  static readonly STACKING_SERIES_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.breakdownOptional,
      title: 'Breakdown',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];

  //Bar chart swap X-Axis's title and Y-Axis's title to display, but key is not change
  static readonly BAR_STACKING_SERIES_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.breakdownOptional,
      title: 'Breakdown',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];

  // static readonly DRILLDOWN_CONFIGS: DraggableConfig[] = [
  //   {
  //     key: ConfigType.legends,
  //     title: 'Legends',
  //     placeholder: 'Drag and drop your fields',
  //     preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram]
  //   },
  //   {
  //     key: ConfigType.value,
  //     title: 'Value',
  //     placeholder: 'Drag and drop your fields',
  //     preferFunctionTypes: [FunctionFamilyTypes.aggregation],
  //     maxItem: 1
  //   }
  // ];

  // static readonly DRILLDOWN_PIE_CONFIGS: DraggableConfig[] = [...DataBuilderConstantsV35.DRILLDOWN_CONFIGS];

  static readonly SCATTER_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.none, FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram, FunctionFamilyTypes.aggregation],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.none, FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram, FunctionFamilyTypes.aggregation],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.none, FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    }
  ];

  static readonly PARLIAMENT_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countOfDistinct),
      defaultDateFunctionInfo: new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countOfDistinct),
      defaultTextFunctionInfo: new FunctionFamilyInfo(FunctionFamilyTypes.aggregation, AggregationFunctionTypes.countOfDistinct)
    }
  ];

  static readonly PIE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly VARIWIDE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.weight,
      title: 'Weight',
      isOptional: true,
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly FUNNEL_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly PYRAMID_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly GAUGE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly BULLED_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly BUBBLE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation, FunctionFamilyTypes.dateHistogram],
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation, FunctionFamilyTypes.dateHistogram],
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation, FunctionFamilyTypes.dateHistogram],
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.aggregation],
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE
    }
  ];

  static readonly PARETO_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.legendOptional,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      isOptional: true,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    }
  ];

  static readonly BELL_CURVE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.none, FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    }
  ];

  static readonly HEAT_MAP_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.xAxis,
      title: 'X-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.yAxis,
      title: 'Y-Axis',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly NUMBER_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly TABLE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.columns,
      title: 'Columns',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram, FunctionFamilyTypes.aggregation, FunctionFamilyTypes.none],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    }
  ];

  static readonly COLLAPSE_TABLE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.columns,
      title: 'Columns',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram, FunctionFamilyTypes.aggregation, FunctionFamilyTypes.none],
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE
    }
  ];

  static readonly WORD_CLOUD_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly TREE_MAP_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legends,
      title: 'Legends',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Values',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly HISTOGRAM_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.none],
      defaultTextFunctionInfo: NONE_FUNCTION_FOR_TEXT,
      defaultNumberFunctionInfo: NONE_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: NONE_FUNCTION_FOR_DATE
    }
  ];

  static readonly MAP_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.location,
      title: 'Location',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.value,
      title: 'Value',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly PIVOT_TABLE_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.columns,
      title: 'Columns',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.rows,
      title: 'Rows',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.values,
      title: 'Values',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly SPIDER_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.legend,
      title: 'Legend',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy, FunctionFamilyTypes.dateHistogram],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.values,
      title: 'Values',
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly SANKEY_CONFIGS: DraggableConfig[] = [
    {
      key: ConfigType.source,
      title: 'Source',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.destination,
      title: 'Destination',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.groupBy],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.breakdowns,
      title: 'Breakdowns',
      isOptional: true,
      maxItem: 1,
      placeholder: 'Drag and drop your fields',
      preferFunctionTypes: [FunctionFamilyTypes.groupBy],
      defaultNumberFunctionInfo: GROUP_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: GROUP_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: GROUP_FUNCTION_FOR_TEXT
    },
    {
      key: ConfigType.weight,
      title: 'Weight',
      placeholder: 'Drag and drop your fields',
      maxItem: 1,
      preferFunctionTypes: [FunctionFamilyTypes.aggregation],
      defaultNumberFunctionInfo: AGGREGATION_FUNCTION_FOR_NUMBER,
      defaultDateFunctionInfo: AGGREGATION_FUNCTION_FOR_DATE,
      defaultTextFunctionInfo: AGGREGATION_FUNCTION_FOR_TEXT
    }
  ];

  static readonly ALL_CHARTS: VisualizationItemData[] = [
    {
      title: 'Table',
      src: 'ic_table.svg',
      type: ChartType.FlattenTable,
      configPanels: DataBuilderConstantsV35.TABLE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Collapse Table',
      src: 'ic_collapse_table.svg',
      type: ChartType.Table,
      configPanels: DataBuilderConstantsV35.COLLAPSE_TABLE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Pivot Table',
      src: 'ic_pivot_table.svg',
      type: ChartType.PivotTable,
      configPanels: DataBuilderConstantsV35.PIVOT_TABLE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Flatten Pivot Table',
      src: 'ic_pivot_table.svg',
      type: ChartType.FlattenPivotTable,
      configPanels: DataBuilderConstantsV35.PIVOT_TABLE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      isHidden: true
    },
    {
      title: 'Number',
      src: 'ic_number.svg',
      type: ChartType.Kpi,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.NUMBER_CONFIGS
    },
    {
      title: 'Line',
      src: 'ic_line_chart.svg',
      type: ChartType.Line,
      configPanels: DataBuilderConstantsV35.SERIES_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Area',
      src: 'ic_chart_area.svg',
      type: ChartType.Area,
      configPanels: DataBuilderConstantsV35.SERIES_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Column',
      src: 'ic_column.svg',
      type: ChartType.Column,
      configPanels: DataBuilderConstantsV35.SERIES_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Bar',
      src: 'ic_bar.svg',
      type: ChartType.Bar,
      configPanels: DataBuilderConstantsV35.BAR_SERIES_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Lollipop',
      src: 'ic_lollipop.svg',
      type: ChartType.Lollipop,
      configPanels: DataBuilderConstantsV35.SERIES_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Parliament',
      src: 'ic_parliament.svg',
      type: ChartType.Parliament,
      configPanels: DataBuilderConstantsV35.PARLIAMENT_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Pie',
      src: 'ic_pie.svg',
      type: ChartType.Pie,
      configPanels: DataBuilderConstantsV35.PIE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Variwide',
      src: 'ic_pie.svg',
      type: ChartType.Variablepie,
      configPanels: DataBuilderConstantsV35.VARIWIDE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Donut',
      src: 'ic_pie.svg',
      type: ChartType.Donut,
      configPanels: DataBuilderConstantsV35.PIE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    // {
    //   title: 'Drilldown Column',
    //   src: 'ic_drilldown_column.svg',
    //   type: WidgetType.columnDrillDown,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
    //   configPanels: DataBuilderConstantsV35.DRILLDOWN_CONFIGS
    // },
    // {
    //   title: 'Drilldown Bar',
    //   src: 'ic_drilldown_bar.svg',
    //   type: WidgetType.barDrillDown,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
    //   configPanels: DataBuilderConstantsV35.DRILLDOWN_CONFIGS
    // },
    // {
    //   title: 'Drilldown Pie',
    //   src: 'ic_drilldown_pie.svg',
    //   type: WidgetType.pieDrillDown,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
    //   configPanels: DataBuilderConstantsV35.DRILLDOWN_PIE_CONFIGS
    // },
    {
      title: 'Scatter',
      src: 'ic_scatter.svg',
      type: ChartType.Scatter,
      configPanels: DataBuilderConstantsV35.SCATTER_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Bubble',
      src: 'ic_bubble.svg',
      type: ChartType.Bubble,
      configPanels: DataBuilderConstantsV35.BUBBLE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Funnel',
      src: 'ic_funnel.svg',
      type: ChartType.Funnel,
      configPanels: DataBuilderConstantsV35.FUNNEL_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Pyramid',
      src: 'ic_pyramid.svg',
      type: ChartType.Pyramid,
      configPanels: DataBuilderConstantsV35.PYRAMID_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    // {
    //   title: 'Histogram',
    //   src: 'ic_histogram.svg',
    //   type: Charts.histogram,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
    //   configPanels: DataBuilderConstantsV35.TWO_CONFIGS,
    //   tabConfigs: VisualizationSettings.DEFAULT
    // },
    {
      title: 'Pareto',
      src: 'ic_pareto.svg',
      type: ChartType.Pareto,
      configPanels: DataBuilderConstantsV35.PARETO_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Bell curve',
      src: 'ic_bell_curve.svg',
      type: ChartType.BellCurve,
      configPanels: DataBuilderConstantsV35.BELL_CURVE_CONFIGS,
      extraPanels: DataBuilderConstantsV35.BELL_CURVE_EXTRA_CONFIGS
    },
    // {
    //   title: 'Combinations',
    //   src: 'ic_combination.svg',
    //   type: 'chart-combination'
    // },
    // {
    //   title: 'Accessible',
    //   src: 'ic_accessible.svg',
    //   type: 'chart-accessible'
    // },
    // {
    //   title: 'Dynamic',
    //   src: 'ic_dynamic.svg',
    //   type: 'chart-dynamic'
    // },
    // { title: '3D', src: 'ic_3d.svg', type: 'chart-3d' },
    {
      title: 'Gauges',
      src: 'ic_gauge.svg',
      type: ChartType.Gauges,
      extraPanels: DataBuilderConstantsV35.GAUGE_FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.GAUGE_CONFIGS
    },
    {
      title: 'Bullet Graph',
      src: 'ic_bullet_chart.svg',
      type: ChartType.Bullet,
      extraPanels: DataBuilderConstantsV35.GAUGE_FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.BULLED_CONFIGS
    },
    {
      title: 'Heat maps',
      src: 'ic_heatmap.svg',
      type: ChartType.HeatMap,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.HEAT_MAP_CONFIGS
    },
    {
      title: 'Word Cloud',
      src: 'ic_word_cloud.svg',
      type: ChartType.WordCloud,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.WORD_CLOUD_CONFIGS
    },
    {
      title: 'Tree maps',
      src: 'ic_tree_map.svg',
      type: ChartType.TreeMap,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.TREE_MAP_CONFIGS
    },
    {
      title: 'Stacked Column',
      src: 'ic_stack_column.svg',
      type: ChartType.StackedColumn,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.STACKING_SERIES_CONFIGS
    },
    {
      title: 'Stacked Bar',
      src: 'ic_stack_bar.svg',
      type: ChartType.StackedBar,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.BAR_STACKING_SERIES_CONFIGS
    },
    {
      title: 'Circular Bar',
      src: 'ic_circular_bar.svg',
      type: ChartType.CircularBar,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.BAR_STACKING_SERIES_CONFIGS
    },
    {
      title: 'Histogram',
      src: 'ic_histogram.svg',
      type: ChartType.Histogram,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.HISTOGRAM_CONFIGS
    },
    {
      title: 'Map',
      src: 'ic_map.svg',
      type: ChartType.Map,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.MAP_CONFIGS
    },
    {
      title: 'Spider Web',
      src: 'ic-spider-chart.svg',
      type: ChartType.SpiderWeb,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.SPIDER_CONFIGS
    },
    {
      title: 'Sankey Diagram',
      src: 'ic_sankey.svg',
      type: ChartType.Sankey,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.SANKEY_CONFIGS
    },
    {
      title: 'Wind Rose',
      src: 'ic_win_rose_chart.svg',
      type: ChartType.WindRose,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS,
      configPanels: DataBuilderConstantsV35.STACKING_SERIES_CONFIGS
    },
    {
      title: 'Line Stock',
      src: 'ic_line_chart.svg',
      type: ChartType.LineStock,
      configPanels: DataBuilderConstantsV35.LINE_STOCK_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    }
  ];

  static readonly ALL_FILTERS: VisualizationItemData[] = [
    // {
    //   title: 'Dropdown',
    //   src: 'ic_dropdown.svg',
    //   type: WidgetType.dropdownFilter,
    //   configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    {
      title: 'Tab',
      src: 'ic_tab_filter.svg',
      type: ChartType.TabFilter,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Single choice',
      src: 'ic_single_choice.svg',
      type: ChartType.SingleChoice,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Multi choice',
      src: 'ic_multi_choice.svg',
      type: ChartType.MultiChoice,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Dropdown',
      src: 'ic_dropdown.svg',
      type: ChartType.DropDown,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Slicer Filter',
      src: 'slicer-filter.svg',
      type: ChartType.SlicerFilter,
      configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Date Filter',
      src: 'date-filter.svg',
      type: ChartType.DateSelectFilter,
      configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Input',
      src: 'ic_input_filter.svg',
      type: ChartType.InputFilter,
      configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Single Tree Filter',
      src: 'ic_single_tree_filter.svg',
      type: ChartType.SingleTreeFilter,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Multi Tree Filter',
      src: 'ic_multi_tree_filter.svg',
      type: ChartType.MultiTreeFilter,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    }
  ];
  static readonly ALL_INNER_FILTERS: VisualizationItemData[] = [
    // {
    //   title: 'Dropdown',
    //   src: 'ic_dropdown.svg',
    //   type: WidgetType.dropdownFilter,
    //   configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    {
      title: 'Dropdown',
      src: 'ic_dropdown.svg',
      type: ChartType.DropDownFilter,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    },
    {
      title: 'Tab Filter',
      src: 'ic_tab_filter.svg',
      type: ChartType.TabInnerFilter,
      configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
      extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    }
    // {
    //   title: 'Single choice',
    //   src: 'ic_single_choice.svg',
    //   type: ChartType.SingleChoice,
    //   configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    // {
    //   title: 'Multi choice',
    //   src: 'ic_multi_choice.svg',
    //   type: ChartType.MultiChoice,
    //   configPanels: DataBuilderConstantsV35.DROP_DOWN_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    // {
    //   title: 'Slicer Filter',
    //   src: 'slicer-filter.svg',
    //   type: ChartType.SlicerFilter,
    //   configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    // {
    //   title: 'Date Filter',
    //   src: 'date-filter.svg',
    //   type: ChartType.DateSelectFilter,
    //   configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // },
    // {
    //   title: 'Input Filter',
    //   src: 'ic_input_filter.svg',
    //   type: ChartType.InputFilter,
    //   configPanels: DataBuilderConstantsV35.VALUE_FILTER_CONFIGS,
    //   extraPanels: DataBuilderConstantsV35.FILTER_CONFIGS
    // }
  ];

  static readonly MULTIPLE_MEASURES: VisualizationItemData[] = [
    {
      title: 'Tab Control',
      src: 'ic_tab_filter.svg',
      type: ChartType.TabMeasurement,
      configPanels: DataBuilderConstantsV35.TAB_MEASUREMENT_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Single Choice Control',
      src: 'ic_single_choice.svg',
      type: ChartType.SingleChoiceMeasurement,
      configPanels: DataBuilderConstantsV35.TAB_MEASUREMENT_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Multi Choice Control',
      src: 'ic_multi_choice.svg',
      type: ChartType.MultiChoiceMeasurement,
      configPanels: DataBuilderConstantsV35.TAB_MEASUREMENT_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Dropdown Control',
      src: 'ic_dropdown.svg',
      type: ChartType.DropDownMeasurement,
      configPanels: DataBuilderConstantsV35.TAB_MEASUREMENT_CONFIGS,
      extraPanels: []
    },
    {
      title: 'Input Control',
      src: 'ic_input_filter.svg',
      type: ChartType.InputControl,
      configPanels: [],
      extraPanels: [],
      useChartBuilder: false
    }
  ];
}

export {
  GROUP_FUNCTION_FOR_DATE,
  GROUP_FUNCTION_FOR_NUMBER,
  GROUP_FUNCTION_FOR_TEXT,
  AGGREGATION_FUNCTION_FOR_NUMBER,
  AGGREGATION_FUNCTION_FOR_DATE,
  AGGREGATION_FUNCTION_FOR_TEXT,
  NONE_FUNCTION_FOR_DATE,
  NONE_FUNCTION_FOR_NUMBER,
  NONE_FUNCTION_FOR_TEXT,
  AGGREGATION_FUNCTION_FOR_MEASURE
};
