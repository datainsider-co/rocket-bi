/*
 * @author: tvc12 - Thien Vi
 * @created: 1/18/21, 6:30 PM
 */

/*
 * @author: tvc12 - Thien Vi
 * @created: 1/18/21, 5:56 PM
 */

import { VisualizationResponse } from '@core/domain/Response';

export abstract class CustomRenderController<VizResponse extends VisualizationResponse> {
  private timer?: number | undefined;

  abstract get containerId(): string;

  processAndRender(data: VizResponse, html: string, css: string, js: string, options: any) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.createPage(html, css, js);

    this.timer = window.setTimeout(() => {
      this.render(data, options);
    }, 300);
  }

  abstract dispose(): void;

  protected abstract render(data: VizResponse, options: any): void;

  protected abstract createPage(html: string, css: string, js: string): void;
}
