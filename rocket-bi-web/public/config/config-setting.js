const setting = {
  'title.tab': {
    'title.enabled': {
      hint: '',
      label: 'Title'
    },
    'title.text': {
      placeHolder: 'Input Title',
      label: 'Title text',
      hint: ''
    },
    'title.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'title.style.color': {
      label: 'Font color',
      hint: ''
    },
    'title.style.fontSize': {
      label: 'Text size',
      hint: ''
    },
    'title.align': {
      hint: '',
      label: 'Alignment'
    },
    'subtitle.enabled': {
      hint: '',
      label: 'Subtitle'
    },
    'subtitle.text': {
      placeHolder: 'Input Subtitle',
      label: 'Subtitle text',
      hint: ''
    },
    'subtitle.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'subtitle.style.color': {
      label: 'Font color',
      hint: ''
    },
    'subtitle.style.fontSize': {
      label: 'Text size',
      hint: ''
    },
    'subtitle.align': {
      hint: '',
      label: 'Alignment'
    }
  },
  'style.tab': {
    theme: {
      hint: 'Change the theme of the table',
      label: 'Select style'
    }
  },
  'grid.tab': {
    'grid.vertical.color': {
      label: 'Vertical grid color',
      hint: ''
    },
    'grid.vertical.thickness': {
      hint: '',
      label: 'Thickness'
    },
    'grid.vertical.applyHeader': {
      hint: '',
      label: 'Header'
    },
    'grid.vertical.applyBody': {
      hint: '',
      label: 'Body'
    },
    'grid.vertical.applyTotal': {
      hint: '',
      label: 'Total'
    },
    'grid.horizontal.color': {
      label: 'Horizontal grid color',
      hint: ''
    },
    'grid.horizontal.thickness': {
      hint: '',
      label: 'Thickness'
    },
    'grid.horizontal.applyHeader': {
      hint: '',
      label: 'Header'
    },
    'grid.horizontal.rowPadding': {
      hint: '',
      label: 'Row Padding'
    },
    'grid.horizontal.applyBody': {
      hint: '',
      label: 'Body'
    },
    'grid.horizontal.applyTotal': {
      hint: '',
      label: 'Total'
    }
  },
  'header.tab': {
    'header.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'header.style.color': {
      label: '',
      hint: ''
    },
    'header.style.fontSize': {
      label: '',
      hint: ''
    },
    'header.align': {
      label: '',
      hint: ''
    },
    'header.backgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'header.isWordWrap': {
      label: 'Text wrap',
      hint: 'Show all information in a cell, even if it overflows the cell boundary'
    }
  },
  'value.tab': {
    'value.color': {
      label: 'Font color',
      hint: ''
    },
    'value.backgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'value.alternateColor': {
      label: 'Alternate font color',
      hint: ''
    },
    'value.alternateBackgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'value.style.isWordWrap': {
      label: 'Text wrap',
      hint: 'Show all information in a cell, even if it overflows the cell boundary'
    },
    'value.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'value.style.fontSize': {
      label: '',
      hint: ''
    },
    'value.align': {
      label: '',
      hint: ''
    }
  },
  'total.tab': {
    'total.enabled': {
      label: 'Total',
      hint: ''
    },
    'total.label.text': {
      label: 'Total label',
      placeHolder: '',
      hint: ''
    },
    'total.label.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'total.label.style.color': {
      label: '',
      hint: ''
    },
    'total.label.style.fontSize': {
      label: '',
      hint: ''
    },
    'total.label.align': {
      label: '',
      hint: ''
    },
    'total.backgroundColor': {
      label: 'Background color',
      hint: ''
    }
  },
  'collapse.tab': {
    'toggleIcon.backgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'toggleIcon.color': {
      label: 'Icon color',
      hint: ''
    }
  },
  'fieldFormatting.tab': {
    'column.select': {
      label: 'Select Field',
      hint: 'Settings for the specific fields will override the settings in the Values section.'
    },
    'fieldFormatting.style.color': {
      label: 'Font color',
      hint: ''
    },
    'fieldFormatting.backgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'fieldFormatting.align': {
      label: 'Alignment',
      hint: ''
    },
    'fieldFormatting.applyHeader': {
      hint: '',
      label: 'Apply to header'
    },
    'fieldFormatting.applyValues': {
      hint: '',
      label: 'Apply to values'
    },
    'fieldFormatting.applyTotals': {
      hint: '',
      label: 'Apply to total'
    }
  },
  'conditionalFormatting.tab': {
    'column.select': {
      label: 'Select Field',
      hint: 'Give cell elements different formatting under different conditions'
    },
    'conditionalFormatting.backgroundColor.enabled': {
      label: 'Background color',
      hint: 'Format cells with color based on a value'
    },
    'conditionalFormatting.color.enabled': {
      label: 'Font color',
      hint: 'Format the font color based on a value'
    },
    'conditionalFormatting.dataBar.enabled': {
      label: 'Data bars',
      hint: 'Add colored bars to cells in a range to indicate how large the cell values are compared to the other values'
    },
    'conditionalFormatting.icon.enabled': {
      label: 'Icons',
      hint: 'Add icons to cells bases on rules'
    }
  },
  'tooltip.tab': {
    'tooltip.valueColor': {
      label: 'Color',
      hint: 'Display details of the cell when hovering over it'
    },
    'tooltip.backgroundColor': {
      label: 'Background color',
      hint: ''
    },
    'tooltip.fontFamily': {
      label: 'Font family',
      hint: ''
    }
  },
  'other.tab': {
    'dataLabels.displayUnit': {
      label: 'Display unit',
      hint: ''
    },
    precision: {
      label: 'Precision',
      hint: 'Choose the number of digits used to show the value'
    },
    affectedByFilter: {
      label: 'Enable external filter',
      hint: 'Turn on enable external filter to apply dashboard and chart filters'
    },
    isCrossFilter: {
      label: 'Enable cross filter',
      hint: `When you single-click to a pie of a pie chart, it will be <a href="https://docs.datainsider.co/rocket.bi/chart-builder/right-click-settings/use-as-a-filter" target="_blank">used as a filter</a> for other charts in the dashboard.`
    },
    isEnableDrilldown: {
      label: 'Enable drilldown',
      hint:
        'Allow users to descend from one level of a specified data stack to the next to explore detailed information in a chart from various perspectives. <a href="https://docs.datainsider.co/rocket.bi/chart-builder/right-click-settings/drill-down" target="_blank">See more</a>'
    },
    isEnableZoom: {
      label: 'Enable change date function',
      hint:
        'Change the date range of a chart to easily view the specific period of time. <a href="https://docs.datainsider.co/rocket.bi/chart-builder/right-click-settings/change-date-function" target="_blank">See more</a>'
    }
  },
  'numberDataLabel.tab': {
    'style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'style.color': {
      label: '',
      hint: ''
    },
    'style.fontSize': {
      label: '',
      hint: ''
    },
    displayUnit: {
      label: 'Display unit',
      hint: ''
    },
    'prefix.text': {
      label: 'Prefix',
      placeHolder: 'Input Prefix',
      hint: ''
    },
    'prefix.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'prefix.style.color': {
      label: '',
      hint: ''
    },
    'prefix.style.fontSize': {
      label: '',
      hint: ''
    },
    'postfix.text': {
      label: 'Postfix',
      placeHolder: 'Input Prefix',
      hint: ''
    },
    'postfix.style.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'postfix.style.color': {
      label: '',
      hint: ''
    },
    'postfix.style.fontSize': {
      label: '',
      hint: ''
    }
  },
  'comparison.tab': {
    'dataRange.enabled': {
      label: 'Default Date Range',
      hint: ''
    },
    'field.select': {
      label: 'Date field',
      hint: ''
    },
    'dataRange.range': {
      label: 'Default range',
      hint: ''
    },
    'comparison.enabled': {
      label: 'Comparison',
      hint: ''
    },
    'comparison.range': {
      label: 'Comparison',
      hint: ''
    },
    'comparison.compareStyle': {
      label: 'Display style',
      hint: ''
    },
    'comparison.uptrendIconColor': {
      label: 'Uptrend color',
      hint: ''
    },
    'comparison.upTrendIcon': {
      label: 'Uptrend icon',
      hint: ''
    },
    'comparison.downtrendIconColor': {
      label: 'Downtrend color',
      hint: ''
    },
    'comparison.downTrendIcon': {
      label: 'Downtrend icon',
      hint: ''
    },
    'trendLine.enabled': {
      label: 'Trend-Line',
      hint: ''
    },
    'trendLine.displayAs': {
      label: 'Trend-Line style',
      hint: ''
    },
    'trendLine.trendBy': {
      label: 'Trend by',
      hint: ''
    }
  },
  'display.tab': {
    'legend.select': {
      label: '',
      hint: ''
    },
    'legend.name': {
      label: 'Display name',
      hint: ''
    },
    'legend.type': {
      label: 'Display',
      hint: ''
    },
    'legend.marker.enabled': {
      label: 'Show marker',
      hint: ''
    },
    'legend.dash': {
      label: '',
      hint: ''
    },
    'legend.dash.width': {
      label: '',
      hint: ''
    },
    'legend.dualAxis': {
      label: 'Use Second Axis',
      hint: ''
    }
  },
  'legend.tab': {
    'legend.enabled': {
      label: 'On',
      hint: 'The categorical field to show for color'
    },
    'legend.verticalAlign': {
      label: 'Position',
      hint: ''
    },
    'legend.title.text': {
      label: 'Legend name',
      placeHolder: 'Input Legend Title',
      hint: ''
    },
    'legend.itemStyle.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'legend.itemStyle.color': {
      label: '',
      hint: ''
    },
    'legend.itemStyle.fontSize': {
      label: '',
      hint: ''
    },
    'legend.enableCustomHeight': {
      label: 'Manual Height',
      hint: 'Custom Height manually'
    },
    'legend.maxHeight': {
      label: '',
      placeHolder: '',
      hint: ''
    }
  },
  'xaxis.tab': {
    'xaxis.enabled': {
      label: 'On',
      hint: 'Fields to place on the horizontal or vertical axis'
    },
    'label.prefix.text': {
      label: 'Prefix',
      placeHolder: 'Input Prefix',
      hint: 'Add a substring to the beginning of the axis value'
    },
    'label.postfix.text': {
      label: 'Postfix',
      placeHolder: 'Input Postfix',
      hint: 'Add a substring to the end of the axis value'
    },
    'xaxis.label.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'xaxis.label.color': {
      label: '',
      hint: ''
    },
    'xaxis.label.fontSize': {
      label: '',
      hint: ''
    },
    'xaxis.title.text.enabled': {
      label: 'Axis title',
      hint: ''
    },
    'xaxis.title.text': {
      label: '',
      placeHolder: 'Input Axis Title',
      hint: ''
    },
    'xaxis.title.fontFamily': {
      label: 'Font Family',
      hint: ''
    },
    'xaxis.title.color': {
      label: '',
      hint: ''
    },
    'xaxis.title.fontSize': {
      label: '',
      hint: ''
    },
    'xaxis.grid.enabled': {
      label: 'Gridlines',
      hint: 'Enable lines crossing the chart plot to show axis division'
    },
    'xaxis.grid.color': {
      label: '',
      hint: ''
    },
    'xaxis.grid.width': {
      label: '',
      hint: 'Input the width of the grid lines'
    },
    'xaxis.grid.dash': {
      label: '',
      hint: 'Select the style of the grid lines'
    }
  },
  'yaxis.tab': {
    'yaxis.enabled': {
      label: 'On',
      hint: 'The numeric amounts to plot'
    },
    'label.prefix.text': {
      label: 'Prefix',
      placeHolder: 'Input Prefix',
      hint: 'Add a substring to the beginning of the axis value'
    },
    'label.postfix.text': {
      label: 'Postfix',
      placeHolder: 'Input Postfix',
      hint: 'Add a substring to the end of the axis value'
    },
    'yaxis.label.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'yaxis.label.color': {
      label: '',
      hint: ''
    },
    'yaxis.label.fontSize': {
      label: '',
      hint: ''
    },
    'yaxis.title.text.enabled': {
      label: 'Axis title',
      hint: ''
    },
    'yaxis.title.text': {
      label: '',
      placeHolder: 'Input Axis Title',
      hint: ''
    },
    'yaxis.title.fontFamily': {
      label: 'Font Family',
      hint: ''
    },
    'yaxis.title.color': {
      label: '',
      hint: ''
    },
    'yaxis.title.fontSize': {
      label: '',
      hint: ''
    },
    'yaxis.grid.enabled': {
      label: 'Gridlines',
      hint: 'Enable lines crossing the chart plot to show axis division'
    },
    'yaxis.grid.color': {
      label: '',
      hint: ''
    },
    'yaxis.grid.width': {
      label: '',
      hint: 'Input the width of the grid lines'
    },
    'yaxis.grid.dash': {
      label: '',
      hint: 'Select the style of the grid lines'
    },
    'yaxis.minmax.enabled': {
      label: 'Config Min Max For Y-Axis',
      hint: 'Set the minimum and maximum values of the axis'
    },
    'yaxis.min.enabled': {
      label: 'Min',
      hint: ''
    },
    'yaxis.min.value': {
      label: 'Min Value',
      hint: ''
    },
    'yaxis.max.enabled': {
      label: 'Max',
      hint: ''
    },
    'yaxis.max.value': {
      label: 'Max Value',
      hint: ''
    }
  },
  'color.tab': {
    'color.auto.enabled': {
      label: 'Auto',
      hint: 'Disable to change color manually'
    }
  },
  'dataLabel.tab': {
    'dataLabel.enable': {
      label: 'On',
      hint: 'Enale to show details about a data series or its individual data points'
    },
    'dataLabel.style': {
      label: 'Label style',
      hint: ''
    },
    'dataLabel.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'dataLabel.color': {
      label: '',
      hint: ''
    },
    'dataLabel.fontSize': {
      label: '',
      hint: ''
    },
    'dataLabel.distance': {
      label: 'Label position',
      hint: ''
    },
    'dataLabel.position': {
      label: 'Label position',
      hint: ''
    },
    'dataLabel.condition.enabled': {
      label: 'Condition',
      hint: 'Highlight the highest and lowest values'
    },
    'dataLabel.condition.min.enabled': {
      label: 'Min',
      hint: ''
    },
    'dataLabel.condition.min.equal': {
      label: '',
      hint: ''
    },
    'dataLabel.condition.min.value': {
      label: '',
      placeholder: 'Input Min Value',
      hint: ''
    },
    'dataLabel.condition.max.enabled': {
      label: 'Max',
      hint: ''
    },
    'dataLabel.condition.max.equal': {
      label: '',
      hint: ''
    },
    'dataLabel.condition.max.value': {
      label: '',
      placeholder: 'Input Max Value',
      hint: ''
    }
  },
  'layout.tab': {
    'layout.select': {
      label: 'Select style',
      hint: 'Select the style of the chart'
    }
  },
  'general.tab': {
    maxDataPoint: {
      label: 'Maximum data point',
      placeHolder: 'Input Data Point',
      hint: 'Represent the maximum number of dots can be displayed in the chart'
    }
  },
  'shape.tab': {
    'shape.dash': {
      label: '',
      hint: ''
    },
    'shape.dash.width': {
      label: '',
      hint: ''
    },
    'shape.marker.enabled': {
      label: 'Show marker',
      hint: ''
    }
  },
  'gaugeAxis.tab': {
    min: {
      label: 'Min',
      hint: 'The value used for the start of the scale',
      placeHolder: 'Input Min Value'
    },
    max: {
      label: 'Max',
      hint: 'The value used for the end of the scale',
      placeHolder: 'Input Max Value'
    },
    'axis.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'axis.color': {
      label: 'Font color',
      hint: ''
    },
    'axis.fontSize': {
      label: 'Text size',
      hint: ''
    },
    'axis.target.value': {
      label: 'Target',
      placeHolder: 'Input Target Value',
      hint: 'The value used for target indicator'
    },
    'axis.target.color': {
      label: 'Target line color',
      hint: ''
    },
    'axis.prefix': {
      label: 'Prefix',
      hint: 'Add a substring to the beginning of the axis value',
      placeHolder: 'Input Prefix'
    },
    'axis.postfix': {
      label: 'Postfix',
      hint: 'Add a substring to the end of the axis value',
      placeHolder: 'Input Postfix'
    }
  },
  'gaugeColor.tab': {
    min: {
      label: 'Min color',
      hint: ''
    },
    average: {
      label: 'Average color',
      hint: ''
    },
    max: {
      label: 'Max color',
      hint: ''
    }
  },
  'bulletColor.tab': {
    range1Color: {
      label: 'Range 1 Color',
      hint: ''
    },
    range2Color: {
      label: 'Range 2 Color',
      hint: ''
    },
    range3Color: {
      label: 'Range 3 Color',
      hint: ''
    }
  },
  'bulletTarget.tab': {
    'target.value': {
      label: 'Target',
      placeholder: 'Input Target Value',
      hint: 'The value used for target indicator'
    },
    'target.width': {
      label: 'Target Width',
      placeholder: '',
      hint: ''
    },
    'target.color': {
      label: 'Color',
      hint: ''
    },
    'bullet.color': {
      label: 'Bullet Color',
      hint: ''
    },
    'bullet.borderWidth': {
      label: 'Border Width',
      placeHolder: '',
      hint: ''
    },
    'border.color': {
      label: 'Border Width',
      placeHolder: '',
      hint: ''
    }
  },
  'heatmapColor.tab': {
    width: {
      label: 'Width between values',
      hint: '',
      placeHolder: ''
    },
    minColor: {
      label: 'Color of Min values',
      hint: ''
    },
    maxColor: {
      label: 'Color of Max Values',
      hint: ''
    },
    noneColor: {
      label: 'Color of None Values',
      hint: ''
    }
  },
  'treemapLayout.tab': {
    'layout.select': {
      label: 'Select layout',
      hint: ''
    }
  },
  'stack.tab': {
    stack: {
      label: 'Stack',
      hint: ''
    }
  },
  'histogram.tab': {
    totalBin: {
      label: 'Total bin column',
      placeHolder: 'Input bin column',
      hint: 'Input the number of bin you want to create'
    }
  },
  'map.tab': {
    'map.select': {
      label: 'Select map',
      hint: 'Choose the map of the country you want to display'
    },
    'label.enabled': {
      label: 'On',
      hint: ''
    },
    'label.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'label.color': {
      label: '',
      hint: ''
    },
    'label.fontSize': {
      label: '',
      hint: ''
    }
  },
  'sankey.tab': {
    'sankey.layout': {
      label: 'Display',
      hint: 'Display the chart in normal style or wheel style'
    },
    'label.enabled': {
      label: 'Data Label',
      hint: ''
    },
    'label.fontFamily': {
      label: 'Font family',
      hint: ''
    },
    'label.color': {
      label: '',
      hint: ''
    },
    'label.fontSize': {
      label: '',
      hint: ''
    }
  },
  'stock.tab': {
    'zoom.enabled': {
      label: 'Zoom',
      hint: 'Enable to zoom in to a specific date range'
    },
    'compare.enabled': {
      label: 'Compare',
      hint: 'Compare the values of the series against the first non-null value'
    },
    display: {
      label: '',
      hint: ''
    }
  },
  'tabControl.tab': {
    position: {
      label: 'Position',
      hint: ''
    },
    'inActive.background': {
      label: 'Background inactive',
      hint: 'Background color of inactive data'
    },
    'active.background': {
      label: 'Background active',
      hint: 'Background color of active data'
    },
    'search.enabled': {
      label: 'Enable search',
      hint: ''
    },
    'search.placeHolder': {
      label: 'Search placeholder',
      placeHolder: 'Search...',
      hint: ''
    },
    'default.set': {
      label: 'Default filter',
      hint: ''
    }
  },
  'slicerControl.tab': {
    step: {
      label: 'Step',
      placeHolder: 'Input Step',
      hint: 'The number determines the increment betweeen each index for slicing'
    },
    'default.set': {
      label: 'Default Comparison',
      hint: ''
    },
    'select.compare': {
      label: 'Default Comparison',
      hint: ''
    },
    'date.enabled': {
      label: 'Use with date',
      hint: 'Turn into a date slicer'
    },
    'min.value': {
      label: 'Min',
      placeholder: 'Input Min Value',
      hint: ''
    },
    'max.value': {
      label: 'Max',
      placeholder: 'Input Max Value',
      hint: ''
    }
  },
  'dateFilter.tab': {
    'default.set': {
      label: 'Default filter',
      hint: ''
    }
  }
};

window.chartSetting = setting;
