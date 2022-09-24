import { ChartType } from '@/shared';

export interface Page {
  hintTexts: string[];
  darkHint?: string;
  lightHint?: string;
}

export interface HintChartData {
  type: ChartType;
  name: string;
  pages: Page[];
}

export const HintCharts: Record<string, HintChartData> = {
  [ChartType.Pie]: {
    type: ChartType.Pie,
    name: 'Pie Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Pie Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-pie.svg',
        lightHint: 'charts/hint/light/hint-pie.svg'
      }
    ]
  },
  [ChartType.Funnel]: {
    type: ChartType.Funnel,
    name: 'Funnel Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Funnel Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-funnel.svg',
        lightHint: 'charts/hint/light/hint-funnel.svg'
      }
    ]
  },
  [ChartType.Pyramid]: {
    type: ChartType.Pyramid,
    name: 'Pyramid Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Pyramid Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-pyramid.svg',
        lightHint: 'charts/hint/light/hint-pyramid.svg'
      }
    ]
  },
  [ChartType.Area]: {
    type: ChartType.Area,
    name: 'Area Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Area Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-area.svg',
        lightHint: 'charts/hint/light/hint-area.svg'
      }
    ]
  },
  [ChartType.Column]: {
    type: ChartType.Column,
    name: 'Column Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Column Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-column.svg',
        lightHint: 'charts/hint/light/hint-column.svg'
      }
    ]
  },
  [ChartType.Bar]: {
    type: ChartType.Bar,
    name: 'Bar Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Bar Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-bar.svg',
        lightHint: 'charts/hint/light/hint-bar.svg'
      }
    ]
  },
  [ChartType.Line]: {
    type: ChartType.Line,
    name: 'Line Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Line Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-line.svg',
        lightHint: 'charts/hint/light/hint-line.svg'
      }
    ]
  },
  [ChartType.Histogram]: {
    type: ChartType.Histogram,
    name: 'Histogram Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Histogram Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-histogram.svg',
        lightHint: 'charts/hint/light/hint-histogram.svg'
      }
    ]
  },
  [ChartType.Pareto]: {
    type: ChartType.Pareto,
    name: 'Pareto Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Pareto Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-pareto.svg',
        lightHint: 'charts/hint/light/hint-pareto.svg'
      }
    ]
  },
  [ChartType.BellCurve]: {
    type: ChartType.BellCurve,
    name: 'Bell Curve Chart',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Bell Curve Chart.'],
        darkHint: 'charts/hint/dark/hint-bell-curve.svg',
        lightHint: 'charts/hint/light/hint-bell-curve.svg'
      }
    ]
  },
  [ChartType.Scatter]: {
    type: ChartType.Scatter,
    name: 'Scatter Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Scatter Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-scatter.svg',
        lightHint: 'charts/hint/light/hint-scatter.svg'
      }
    ]
  },
  [ChartType.Bubble]: {
    type: ChartType.Bubble,
    name: 'Bubble Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Bubble Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-bubble.svg',
        lightHint: 'charts/hint/light/hint-bubble.svg'
      }
    ]
  },
  [ChartType.Kpi]: {
    type: ChartType.Kpi,
    name: 'Number Chart',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Number Chart.'],
        darkHint: 'charts/hint/dark/hint-number.svg',
        lightHint: 'charts/hint/light/hint-number.svg'
      }
    ]
  },
  [ChartType.ColumnDrillDown]: {
    type: ChartType.ColumnDrillDown,
    name: 'Drilldown Column Chart',
    pages: [
      {
        hintTexts: [
          '- Drag the Legend properties you want to display on the Drilldown Column Chart.',
          '- Drag the values corresponding to the Legend properties.'
        ],
        darkHint: 'charts/hint/dark/hint-drilldown-column.svg',
        lightHint: 'charts/hint/light/hint-drilldown-column.svg'
      }
    ]
  },
  [ChartType.PieDrillDown]: {
    type: ChartType.PieDrillDown,
    name: 'Drilldown Pie Chart',
    pages: [
      {
        hintTexts: [
          '- Drag the Legend properties you want to display on the Drilldown Pie Chart.',
          '- Drag the values corresponding to the Legend properties.'
        ],
        darkHint: 'charts/hint/dark/hint-drilldown-pie.svg',
        lightHint: 'charts/hint/light/hint-drilldown-pie.svg'
      }
    ]
  },
  [ChartType.BarDrillDown]: {
    type: ChartType.BarDrillDown,
    name: 'Drilldown Bar Chart',
    pages: [
      {
        hintTexts: [
          '- Drag the Legend properties you want to display on the Drilldown Bar Chart.',
          '- Drag the values corresponding to the Legend properties.'
        ],
        darkHint: 'charts/hint/dark/hint-drilldown-bar.svg',
        lightHint: 'charts/hint/light/hint-drilldown-bar.svg'
      }
    ]
  },
  [ChartType.HeatMap]: {
    type: ChartType.HeatMap,
    name: 'Heat maps Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Heat maps Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-heatmap.svg',
        lightHint: 'charts/hint/light/hint-heatmap.svg'
      }
    ]
  },
  [ChartType.Gauges]: {
    type: ChartType.Gauges,
    name: 'Gauges Chart',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Gauges Chart.'],
        darkHint: 'charts/hint/dark/hint-gauges.svg',
        lightHint: 'charts/hint/light/hint-gauges.svg'
      }
    ]
  },
  [ChartType.Map]: {
    type: ChartType.Map,
    name: 'Map Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Map Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-map.svg',
        lightHint: 'charts/hint/light/hint-map.svg'
      }
    ]
  },
  [ChartType.Parliament]: {
    type: ChartType.Parliament,
    name: 'Parliament Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Parliament Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-parliament.svg',
        lightHint: 'charts/hint/light/hint-parliament.svg'
      }
    ]
  },
  [ChartType.PivotTable]: {
    type: ChartType.PivotTable,
    name: 'Pivot Table Chart',
    pages: [
      {
        hintTexts: [
          '- Drag the Rows properties you want to display on the Pivot Table.',
          '- Drag the Columns properties you want to display on the Pivot Table.',
          '- Drag the Values corresponding to the rows and columns properties.'
        ],
        darkHint: 'charts/hint/dark/hint-pivot-table.svg',
        lightHint: 'charts/hint/light/hint-pivot-table.svg'
      }
    ]
  },
  [ChartType.StackedBar]: {
    type: ChartType.StackedBar,
    name: 'Stacked Bar Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Stacked Bar Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-stack-bar.svg',
        lightHint: 'charts/hint/light/hint-stack-bar.svg'
      }
    ]
  },
  [ChartType.StackedColumn]: {
    type: ChartType.StackedColumn,
    name: 'Stacked Column Chart',
    pages: [
      {
        hintTexts: [
          '- Drag the Legend properties you want to display on the Stacked Column Chart.',
          '- Drag the values corresponding to the Legend properties.'
        ],
        darkHint: 'charts/hint/dark/hint-stack-column.svg',
        lightHint: 'charts/hint/light/hint-stack-column.svg'
      }
    ]
  },
  [ChartType.Table]: {
    type: ChartType.Table,
    name: 'Table Chart',
    pages: [
      {
        hintTexts: ['- Drag the Columns properties you want to display on the Table Chart.'],
        darkHint: 'charts/hint/dark/hint-table.svg',
        lightHint: 'charts/hint/light/hint-table.svg'
      }
    ]
  },
  [ChartType.TreeMap]: {
    type: ChartType.TreeMap,
    name: 'Tree Maps Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Tree Maps Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-treemap.svg',
        lightHint: 'charts/hint/light/hint-treemap.svg'
      }
    ]
  },
  [ChartType.WordCloud]: {
    type: ChartType.WordCloud,
    name: 'Word Cloud Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Word Cloud Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-word-cloud.svg',
        lightHint: 'charts/hint/light/hint-word-cloud.svg'
      }
    ]
  },
  [ChartType.SpiderWeb]: {
    type: ChartType.SpiderWeb,
    name: 'Spider Web Chart',
    pages: [
      {
        hintTexts: ['- Drag the Legend properties you want to display on the Spider Web Chart.', '- Drag the values corresponding to the Legend properties.'],
        darkHint: 'charts/hint/dark/hint-spider-web.svg',
        lightHint: 'charts/hint/light/hint-spider-web.svg'
      }
    ]
  },
  [ChartType.TabFilter]: {
    type: ChartType.Table,
    name: 'Tab Filter',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Tab Filter.'],
        darkHint: 'charts/hint/dark/hint-tabfilter.svg',
        lightHint: 'charts/hint/light/hint-tabfilter.svg'
      }
    ]
  },
  [ChartType.SingleChoice]: {
    type: ChartType.SingleChoice,
    name: 'Single Choice',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Single Choice.'],
        darkHint: 'charts/hint/dark/hint-singlechoice.svg',
        lightHint: 'charts/hint/light/hint-singlechoice.svg'
      }
    ]
  },
  [ChartType.MultiChoice]: {
    type: ChartType.MultiChoice,
    name: 'Multi Choice',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Multi Choice.'],
        darkHint: 'charts/hint/dark/hint-multichoice.svg',
        lightHint: 'charts/hint/light/hint-multichoice.svg'
      }
    ]
  },
  [ChartType.DropDown]: {
    type: ChartType.DropDown,
    name: 'Dropdown',
    pages: [
      {
        hintTexts: ['- Drag the Value properties you want to display on the Dropdown.'],
        darkHint: 'charts/hint/dark/hint-dropdown.svg',
        lightHint: 'charts/hint/light/hint-dropdown.svg'
      }
    ]
  }
};
