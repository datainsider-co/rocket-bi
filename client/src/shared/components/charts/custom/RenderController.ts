import { VisualizationResponse } from '@core/domain/Response';
import { PageRenderService } from '@chart/custom/PageRenderService';
import { RandomUtils } from '@/utils';
import { RenderProcessService } from '@chart/custom/RenderProcessService';

export interface CRenderComponent {
  html: string;
  css: string;
  js: string;
}
export interface CRenderPage {
  style?: HTMLStyleElement;
  script?: HTMLScriptElement;
  iframe?: HTMLIFrameElement;
}
export interface CRenderContent<T> {
  data: T;
  options: any;
}

export class RenderController<Response extends VisualizationResponse> {
  private readonly page!: CRenderPage;
  constructor(private pageService: PageRenderService, private processService: RenderProcessService<Response>, public genId: number = RandomUtils.nextInt()) {
    this.page = this.initPage();
  }
  private timer?: number | undefined;

  get containerId(): string {
    return `container-${this.genId}`;
  }

  private get functionName(): string {
    return `customRender${this.genId}`;
  }

  processAndRender(component: CRenderComponent, content: CRenderContent<Response>) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.pageService.createPage(this.page, component, this.containerId, this.functionName);

    this.timer = window.setTimeout(() => {
      this.processService.render(this.page, content, this.functionName);
    }, 300);
  }

  dispose(): void {
    this.page?.iframe?.remove();
    this.page?.style?.remove();
    this.page?.script?.remove();
  }
  initPage(): CRenderPage {
    return {
      iframe: undefined,
      style: undefined,
      script: undefined
    };
  }
}
