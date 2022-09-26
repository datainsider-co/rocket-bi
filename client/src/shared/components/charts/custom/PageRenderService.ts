import { HTMLRender } from '@chart/custom/render/HTMLRender';
import { CSSRender } from '@chart/custom/render/CSSRender';
import { JSRender } from '@chart/custom/render/JSRender';
import { CRenderComponent, CRenderPage } from '@chart/custom/RenderController';

export abstract class PageRenderService {
  abstract createPage(page: CRenderPage, component: CRenderComponent, containerId: string, functionName: string): void;
}

export class PageRenderServiceImpl extends PageRenderService {
  constructor(private htmlRender: HTMLRender, private cssRender: CSSRender, private jsRender: JSRender) {
    super();
  }

  createPage(element: CRenderPage, component: CRenderComponent, containerId: string, functionName: string): void {
    ///Not change priority
    this.htmlRender.loadHtml(element, containerId, component.html);
    this.cssRender.loadCss(element, component.css);
    this.jsRender.loadJs(element, functionName, component.js);
  }
}
