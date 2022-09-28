import { CRenderPage } from '@chart/custom/RenderController';

function createIFrame(customHtml: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.sandbox.add('allow-scripts', 'allow-same-origin');
  iframe.scrolling = 'no';
  return iframe;
}

export abstract class HTMLRender {
  abstract loadHtml(page: CRenderPage, containerId: string, html: string): void;
}

export class FullHTMLRender implements HTMLRender {
  loadHtml(page: CRenderPage, containerId: string, html: string): void {
    if (page.iframe) {
      page.iframe.remove();
    }
    const el = document.getElementById(containerId);
    page.iframe = createIFrame(html);
    el?.appendChild(page.iframe);

    if (page.iframe.contentWindow) {
      // TODO(tvc12): workaround load document before inject HTML to body (work for firefox)
      page.iframe.contentWindow.document.open();
      page.iframe.contentWindow.document.close();
      //
      const body = page.iframe.contentWindow.document.body;
      page.iframe.contentWindow.document.documentElement.innerHTML = html;
      body.style.setProperty('background-color', 'transparent');
    }
  }
}
export class BodyHTMLRender implements HTMLRender {
  loadHtml(page: CRenderPage, containerId: string, html: string): void {
    if (page.iframe) {
      page.iframe.remove();
    }
    const el = document.getElementById(containerId);
    page.iframe = createIFrame(html);
    el?.appendChild(page.iframe);

    if (page.iframe.contentWindow) {
      // TODO(tvc12): workaround load document before inject HTML to body (work for firefox)
      page.iframe.contentWindow.document.open();
      page.iframe.contentWindow.document.close();
      //
      const body = page.iframe.contentWindow.document.body;
      body.style.setProperty('background-color', 'transparent');
      body.innerHTML = html;
    }
  }
}
