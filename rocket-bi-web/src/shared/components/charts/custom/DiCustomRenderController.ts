/*
 * @author: tvc12 - Thien Vi
 * @created: 1/18/21, 6:30 PM
 */

import { RandomUtils } from '@/utils';
import { CustomRenderController } from '@chart/custom/CustomRenderController';
import Mustache from 'mustache';
import KebabCase from 'lodash/kebabCase';
import { _ThemeStore } from '@/store/modules/ThemeStore';
import Highcharts from 'highcharts';

export class DiCustomRenderController extends CustomRenderController<any> {
  protected style!: HTMLStyleElement;
  protected script!: HTMLScriptElement;
  protected iframe!: HTMLIFrameElement;

  constructor(private defaultHtml: string, private defaultCss: string, private defaultJs: string, public genId: number = RandomUtils.nextInt()) {
    super();
  }

  get containerId(): string {
    return `container-${this.genId}`;
  }

  private get functionName(): string {
    return `customRender${this.genId}`;
  }

  private static injectBootstrap(iframeDocument: Document): void {
    const el = iframeDocument.createElement('link');
    el.href = 'https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css';
    el.integrity = 'sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh';
    el.crossOrigin = 'anonymous';
    el.rel = 'stylesheet';
    iframeDocument.head.appendChild(el);
    const meta = iframeDocument.createElement('meta');
    meta.content = 'width=device-width,initial-scale=1.0';
    meta.name = 'viewport';
    iframeDocument.head.appendChild(meta);
  }

  private static injectParentColor(iframeDocument: Document) {
    // fixme: inject parent color
    // Object.entries(_ThemeStore.currentTheme).forEach((value, index) => {
    //   const [rawName, color] = value;
    //   const themeName = `--${KebabCase(rawName)}`;
    //   iframeDocument.documentElement.style.setProperty(themeName, color);
    // });
  }

  private static createIFrame(customHtml: string): HTMLIFrameElement {
    const iframe = document.createElement('iframe');
    iframe.sandbox.add('allow-scripts', 'allow-same-origin');
    iframe.scrolling = 'no';

    return iframe;
  }

  private static createStyle(iframeDocument: Document, css: string) {
    DiCustomRenderController.injectParentColor(iframeDocument);
    DiCustomRenderController.injectBootstrap(iframeDocument);
    DiCustomRenderController.injectFontAwesome(iframeDocument);
    const style = iframeDocument.createElement('style');
    style.innerHTML = css;
    style['type'] = 'text/css';
    iframeDocument.head.appendChild(style);
    return style;
  }

  private static injectFontAwesome(iframeDocument: Document) {
    const el = iframeDocument.createElement('link');
    el.href = 'https://use.fontawesome.com/releases/v5.0.6/css/all.css';
    el.rel = 'stylesheet';
    iframeDocument.head.appendChild(el);
  }

  setDefaultTemplate(data: { defaultHtml?: string; defaultCss?: string; defaultJs?: string }) {
    if (data.defaultHtml) {
      this.defaultHtml = data.defaultHtml;
    }
    if (data.defaultCss) {
      this.defaultCss = data.defaultCss;
    }
    if (data.defaultJs) {
      this.defaultJs = data.defaultJs;
    }
  }

  dispose(): void {
    if (this.style) {
      this.style.remove();
    }

    if (this.script) {
      this.script.remove();
    }

    if (this.iframe) {
      this.iframe.remove();
    }
  }

  protected createPage(html: string, css: string, js: string) {
    this.loadHtml(html);
    this.loadCss(css);
    this.loadJs(js);
  }

  protected loadCss(customCss: string): void {
    if (this.style) {
      this.style.remove();
    }

    const iframeDocument: Document | undefined = this.iframe.contentWindow?.document;

    if (iframeDocument) {
      this.style = DiCustomRenderController.createStyle(iframeDocument, customCss);
    }
  }

  protected loadHtml(customHtml: string): void {
    if (this.iframe) {
      this.iframe.remove();
    }
    const el = document.getElementById(this.containerId);

    this.iframe = DiCustomRenderController.createIFrame(customHtml);
    el?.appendChild(this.iframe);

    if (this.iframe.contentWindow) {
      // TODO(tvc12): workaround load document before inject HTML to body (work for firefox)
      this.iframe.contentWindow.document.open();
      this.iframe.contentWindow.document.close();
      //
      const body = this.iframe.contentWindow.document.body;
      body.style.setProperty('background-color', 'transparent');
      body.innerHTML = customHtml;
    }
  }

  protected loadJs(customJs: string): void {
    if (this.script) {
      this.script.remove();
    }
    const iframeDocument: Document | undefined = this.iframe.contentWindow?.document;
    if (iframeDocument) {
      this.script = iframeDocument.createElement('script');
      this.script.type = 'text/javascript';
      this.script.innerHTML = `window.${this.functionName} = ${customJs}`;
      iframeDocument.head.appendChild(this.script);
    }
  }

  protected render(data: any, options: any): void {
    const fn = this.getExecuteFunction();
    if (this.iframe.contentWindow) {
      const window: Window = this.iframe.contentWindow.window;
      (window as any).Mustache = Mustache;
      (window as any).highcharts = Highcharts;
    }

    if (fn && typeof fn === 'function') {
      fn(data, options);
    }
  }

  private getExecuteFunction(): ((data: any, options: any) => void) | undefined {
    if (this.iframe.contentWindow) {
      const window: Window = this.iframe.contentWindow.window;
      return (window as any)[this.functionName];
    } else {
      return void 0;
    }
  }
}
