import { CRenderPage } from '@chart/custom/RenderController';

export abstract class CSSRender {
  abstract loadCss(page: CRenderPage, css: string): void;
}

function injectParentColor(iframeDocument: Document) {
  // fixme: inject parent color
  // Object.entries(_ThemeStore.currentTheme).forEach((value, index) => {
  //   const [rawName, color] = value;
  //   const themeName = `--${KebabCase(rawName)}`;
  //   iframeDocument.documentElement.style.setProperty(themeName, color);
  // });
}

function injectBootstrap(iframeDocument: Document): void {
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

function injectFontAwesome(iframeDocument: Document) {
  const el = iframeDocument.createElement('link');
  el.href = 'https://use.fontawesome.com/releases/v5.0.6/css/all.css';
  el.rel = 'stylesheet';
  iframeDocument.head.appendChild(el);
}

function createStyle(iframeDocument: Document, css: string) {
  injectParentColor(iframeDocument);
  injectBootstrap(iframeDocument);
  injectFontAwesome(iframeDocument);
  const style = iframeDocument.createElement('style');
  style.innerHTML = css;
  style['type'] = 'text/css';
  iframeDocument.head.appendChild(style);
  return style;
}
export class CssRenderImpl implements CSSRender {
  loadCss(page: CRenderPage, css: string): void {
    if (page.style) {
      page.style.remove();
    }

    const iframeDocument: Document | undefined = page.iframe?.contentWindow?.document;

    if (iframeDocument) {
      page.style = createStyle(iframeDocument, css);
    }
  }
}
