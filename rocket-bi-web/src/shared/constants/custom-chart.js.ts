import { ChartType } from '@/shared';

export const CustomTableJs = `function(data, options) {
  const container = document.getElementById('custom-chart');

  const records = []
  for (record of data.records) {
    const length = Object.keys(record).length - 1;
    const r = [];
    for (let i = 0; i < length; i++) {
      r.push(record[i]);
    }
    records.push(r)
  }

  const rendered = Mustache.render(getTemplate(), {
    headers: data.headers,
    records: records,
  })
  container.innerHTML = rendered
}
function getTemplate() {
  return \`<table class="table-chart table table-striped table-dark table-bordered table-hover">
      <thead>
        <tr>
          {{#headers}}
          <th>{{label}}</th>
          {{/headers}}
        </tr>
      </thead>
      <tbody>
        {{#records}}
        <tr>
          {{#.}}
          <td>{{.}}</td>
          {{/.}}
        </tr>
        {{/records}}
      </tbody>
    </table>\`;
}
`;
export const DefaultJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
}`;
export const CustomLineChartJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
  highcharts.chart(container, {
    series: data.series,
    chart: {
      backgroundColor: options.background,
      style: {
        fontFamily: 'Barlow'
      }
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true
    },
    title: {
      text: options.title,
      style: {
        color: options.textColor
      }
    },
    subtitle: {
      text: options.subtitle,
      style: {
        color: options.textColor
      }
    },
    yAxis: data.yAxis,
    xAxis: {
      categories: data.xAxis
    },
    legend: {
      enabled: options.legend.enabled,
      layout: 'vertical',
      align: 'center',
      verticalAlign: 'bottom'
    },
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: 2010
      }
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'vertical',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }
      ]
    }
  });
}`;
export const CustomColumnChartJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
  highcharts.chart(container, {
    series: data.series,
    chart: {
      backgroundColor: options.background,
      style: {
        fontFamily: 'Barlow'
      },
      type: 'column'
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true
    },
    title: {
      text: options.title,
      style: {
        color: options.textColor
      }
    },
    subtitle: {
      text: options.subtitle,
      style: {
        color: options.textColor
      }
    },
    yAxis: data.yAxis,
    xAxis: {
      categories: data.xAxis
    },
    legend: {
      enabled: options.legend.enabled,
      layout: 'vertical',
      align: 'center',
      verticalAlign: 'bottom'
    },
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: 2010
      }
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'vertical',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }
      ]
    }
  });
}`;
export const CustomBarChartJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
  highcharts.chart(container, {
    series: data.series,
    chart: {
      backgroundColor: options.background,
      style: {
        fontFamily: 'Barlow'
      },
      type: 'bar'
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true
    },
    title: {
      text: options.title,
      style: {
        color: options.textColor
      }
    },
    subtitle: {
      text: options.subtitle,
      style: {
        color: options.textColor
      }
    },
    yAxis: data.yAxis,
    xAxis: {
      categories: data.xAxis
    },
    legend: {
      enabled: options.legend.enabled,
      layout: 'vertical',
      align: 'center',
      verticalAlign: 'bottom'
    },
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: 2010
      }
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'vertical',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }
      ]
    }
  });
}`;
export const CustomAreaChartJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
  highcharts.chart(container, {
    series: data.series,
    chart: {
      backgroundColor: options.background,
      style: {
        fontFamily: 'Barlow'
      },
      type: 'area'
    },
    credits: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    boost: {
      useGPUTranslations: true,
      usePreAllocated: true
    },
    title: {
      text: options.title,
      style: {
        color: options.textColor
      }
    },
    subtitle: {
      text: options.subtitle,
      style: {
        color: options.textColor
      }
    },
    yAxis: data.yAxis,
    xAxis: {
      categories: data.xAxis
    },
    legend: {
      enabled: options.legend.enabled,
      layout: 'vertical',
      align: 'center',
      verticalAlign: 'bottom'
    },
    plotOptions: {
      series: {
        label: {
          connectorAllowed: false
        },
        pointStart: 2010
      }
    },
    responsive: {
      rules: [
        {
          condition: {
            maxWidth: 500
          },
          chartOptions: {
            legend: {
              layout: 'vertical',
              align: 'center',
              verticalAlign: 'bottom'
            }
          }
        }
      ]
    }
  });
}`;

export const CustomNumberChartJs = `function (data, options) {
  const container = document.getElementById('custom-chart');
  const compareValue = getCompareValue(data);
  const rendered = Mustache.render(getTemplate(), {
    options: options,
    displayValue: data.series[0].data[0],
    compareValue: Math.abs(compareValue),
    isCompareValueUp: compareValue >= 0
  })
  container.innerHTML = rendered
}

function getTemplate() {
  return  \`<div class="number-title text-nowrap w-100">
    {{options.title}}
  </div>
  <div class="number-sub-title text-nowrap w-100">
    {{options.subtitle}}
  </div>
  <div class="d-flex flex-row align-items-center">
    <i class="far fa-money-bill-alt m-4"></i>
    <div class="widget-number text-nowrap w-100">
      {{displayValue}}
    </div>
  </div>
  {{#compareValue}}
  <div class="compare-widget d-flex align-items-center text-nowrap">
    {{#isCompareValueUp}}
      <i class="fas fa-thumbs-up m-2"></i>
      <div class="compare-widget-content value-up">
        {{ compareValue }} %
      </div>
    {{/isCompareValueUp}}
    {{^isCompareValueUp}}
      <i class="fas fa-thumbs-down m-2"></i>
      <div class="compare-widget-content value-down">
        {{ compareValue }} %
      </div>
    {{/isCompareValueUp}}
  </div>
  {{/compareValue}}\`;
}

function getCompareValue(data) {
  if (data.compareResponses) {
    const response = data.compareResponses.get("PercentageDifference");
    if (response) {
      return response.series[0].data[0];
    }
  }
  return void 0;
}`;

export const CustomJsAsMap = new Map<ChartType, string>([
  [ChartType.Table, CustomTableJs],
  [ChartType.Line, CustomLineChartJs],
  [ChartType.Column, CustomColumnChartJs],
  [ChartType.Bar, CustomBarChartJs],
  [ChartType.Area, CustomAreaChartJs],
  [ChartType.Kpi, CustomNumberChartJs]
]);
