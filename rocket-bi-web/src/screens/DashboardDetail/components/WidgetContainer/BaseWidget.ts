import { Component, Vue } from 'vue-property-decorator';
import { WidgetRenderer } from '@chart/WidgetRenderer';
import { ChartInfo } from '@core/domain';

/**
 * @deprecated will remove as soon as
 */
export interface Zoomable {
  isHorizontalZoomIn(): boolean;

  isHorizontalZoomOut(): boolean;
}

// @ts-ignore
@Component
export abstract class BaseWidget extends Vue {
  protected abstract renderer: WidgetRenderer<BaseWidget>;

  abstract resize(): void;

  abstract downloadCSV(): void;

  render(h: any): any {
    return this.renderer.render(this, h);
  }

  updateChart(chartInfo: ChartInfo) {
    // FIXME: handle update chart when chart info change
  }
}
