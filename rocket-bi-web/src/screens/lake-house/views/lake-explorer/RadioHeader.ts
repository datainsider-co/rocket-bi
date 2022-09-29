import { CustomHeader, IndexedHeaderData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';

export class RadioHeader implements CustomHeader {
  click: (event: MouseEvent, checked: boolean) => void;
  check: boolean;

  constructor(click: (event: MouseEvent, checked: boolean) => void, checked?: boolean) {
    this.click = click;
    this.check = checked ?? false;
  }

  render(headerData: IndexedHeaderData): HTMLElement | HTMLElement[] | string {
    const radio = document.createElement('input');
    radio.setAttribute('type', 'checkbox');
    radio.checked = this.check ?? false;
    radio.addEventListener('click', e => {
      this.click(e, radio.checked);
    });
    const radioContent: HTMLElement = document.createElement('div');
    const container = document.createElement('div');
    container.appendChild(radio);
    container.appendChild(radioContent);
    HtmlElementRenderUtils.addClass(container, 'radio-cell');
    return container;
  }
}
