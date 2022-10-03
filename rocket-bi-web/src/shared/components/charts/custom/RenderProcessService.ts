import { VisualizationResponse } from '@core/common/domain/response';
import Mustache from 'mustache';
import Highcharts from 'highcharts';
import { CRenderContent, CRenderPage } from '@chart/custom/RenderController';

export abstract class RenderProcessService<Response extends VisualizationResponse> {
  abstract render(page: CRenderPage, content: CRenderContent<Response>, functionName: string): void;
}

export class DefaultRenderProcessService<Response extends VisualizationResponse> extends RenderProcessService<Response> {
  render(page: CRenderPage, content: CRenderContent<Response>, functionName: string): void {
    if (page.iframe?.contentWindow) {
      const fn = this.getExecuteFunction(page.iframe, functionName);
      const window: Window = page.iframe.contentWindow.window;
      (window as any).Mustache = Mustache;
      (window as any).highcharts = Highcharts;
      if (fn && typeof fn === 'function') {
        fn(content.data, content.options);
      }
    }
  }
  private getExecuteFunction(iframe: HTMLIFrameElement, functionName: string): ((data: any, options: any) => void) | undefined {
    if (iframe.contentWindow) {
      const window: Window = iframe.contentWindow.window;
      return (window as any)[functionName];
    } else {
      return void 0;
    }
  }
}
///Not use class at now
// class MapCRenderProcessService<Response extends VisualizationResponse> extends RenderProcessService<Response> {
//   render(page: CRenderPage, content: CRenderMapContent<Response>, functionName: string): void {
//     if (page.iframe?.contentWindow) {
//       const fn = this.getExecuteFunction(page.iframe, functionName);
//       Log.debug('fn::', fn);
//       const window: Window = page.iframe.contentWindow.window;
//       (window as any).Mustache = Mustache;
//       (window as any).highcharts = Highcharts;
//       if (fn && typeof fn === 'function') {
//         fn(content.data, content.options, content.mapModule);
//       }
//     }
//   }
//   private getExecuteFunction(iframe: HTMLIFrameElement, functionName: string): ((data: any, options: any, map: any) => void) | undefined {
//     if (iframe.contentWindow) {
//       const window: Window = iframe.contentWindow.window;
//       return (window as any)[functionName];
//     } else {
//       return void 0;
//     }
//   }
// }
