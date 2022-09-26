import { CRenderPage } from '@chart/custom/RenderController';

export abstract class JSRender {
  abstract loadJs(page: CRenderPage, functionName: string, js: string): void;
}

export class JSRenderImpl extends JSRender {
  loadJs(page: CRenderPage, functionName: string, js: string): void {
    if (page.script) {
      page.script.remove();
    }
    const iframeDocument: Document | undefined = page.iframe?.contentWindow?.document;
    if (iframeDocument) {
      page.script = iframeDocument.createElement('script');
      page.script.type = 'text/javascript';
      page.script.innerHTML = `window.${functionName} = ${js}`;
      iframeDocument.head.appendChild(page.script);
    }
  }
}
