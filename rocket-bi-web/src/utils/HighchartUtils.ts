/*
 * @author: tvc12 - Thien Vi
 * @created: 1/20/21, 11:26 AM
 */

import { RangeData } from '@core/common/services/Formatter';
import Highcharts, { Point, Series } from 'highcharts';
import { Log } from '@core/utils';
import { DIException } from '@core/common/domain';

export enum MetricNumberMode {
  None = 'none',
  Mass = 'mass',
  Text = 'text',
  Default = 'default',
  Percentage = 'percentage'
}

export class HighchartUtils {
  static readonly BASE_PACKAGE_PATH = '@highcharts/map-collection/';

  static reset(chart: Highcharts.Chart | undefined | null): void {
    if (chart) {
      while (chart.series.length) {
        chart.series[0].remove(false, false, false);
      }
    }
  }

  static addSeries(chart: Highcharts.Chart | undefined | null, series: any[]): Series[] {
    if (chart) {
      return series.map((s: any) => chart.addSeries(s, false, false));
    } else {
      return [];
    }
  }

  static drawChart(chart: Highcharts.Chart | undefined | null) {
    if (chart) {
      chart.redraw();
    }
  }

  static updateChart(chart: Highcharts.Chart | undefined | null, options: any, redraw?: boolean) {
    try {
      chart?.update(options, redraw ?? false, false, false);
    } catch (e) {
      Log.error('Cant not update chart options');
    }
  }

  static updateColors(chart: Highcharts.Chart | undefined | null, colors: string[], redraw?: boolean) {
    this.updateChart(
      chart,
      {
        colors: colors
      },
      redraw
    );
  }

  static updateChartInfo(chart: Highcharts.Chart | undefined | null, data: { title: string | undefined; subTitle: string | undefined }, redraw?: boolean) {
    if (chart) {
      chart.update(
        {
          title: {
            text: data.title
          },
          subtitle: {
            text: data.subTitle
          }
        },
        redraw ?? false,
        false,
        false
      );
    }
  }

  static toMetricNumbers(metricNumber: MetricNumberMode): string[] | undefined {
    // const metricNumbers = options.metricNumbers as string;
    switch (metricNumber) {
      case MetricNumberMode.None:
        return undefined;
      case MetricNumberMode.Mass:
        return ['kg', 'Mg', 'Gg', 'Tg', 'Pg', 'Eg'];
      case MetricNumberMode.Text:
        return [' Thousand', ' Million', ' Billion', ' Trillion', ' Quadrillion', ' Quintillion'];
      case MetricNumberMode.Percentage:
        return ['%', '%', '%', '%', '%', '%'];
      default:
        return ['k', 'M', 'B', 'T', 'P', 'E'];
    }
  }

  static buildRangeData(metricNumbers: string[] | undefined): RangeData[] | undefined {
    if (metricNumbers) {
      return [
        { divider: 1e18, suffix: metricNumbers[5] },
        { divider: 1e15, suffix: metricNumbers[4] },
        { divider: 1e12, suffix: metricNumbers[3] },
        { divider: 1e9, suffix: metricNumbers[2] },
        { divider: 1e6, suffix: metricNumbers[1] },
        { divider: 1e3, suffix: metricNumbers[0] }
      ];
    }
    return undefined;
  }

  static addSeriesEvent(series: Series[], eventName: 'contextmenu', listener: (event: MouseEvent, point: Point) => void): void {
    series.forEach(item => {
      item.points.forEach((point: any) =>
        point.graphic.on(eventName, function(event: MouseEvent) {
          listener(event, point);
        })
      );
    });
  }

  static async initMapData(path: string): Promise<any> {
    if (path) {
      const response = await fetch(`/map/${path}`);
      return response.json();
    } else {
      throw new DIException(`Please select map to display!`);
    }
  }
}
