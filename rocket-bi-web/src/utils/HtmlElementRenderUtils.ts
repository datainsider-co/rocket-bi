import { RandomUtils } from '@/utils/RandomUtils';
import { StringUtils } from '@/utils/StringUtils';
import { IconUtils } from '@/utils/IconUtils';
import { Log } from '@core/utils';

type IconType = 'di-icon-edit' | 'di-icon-delete';

export class HtmlElementRenderUtils {
  private static readonly backgrounds = [
    '#1abc9c',
    '#2ecc71',
    '#3498db',
    '#72BD64',
    '#68B4B4',
    '#16a085',
    '#27ae60',
    '#2980b9',
    '#72BD64',
    '#FF6FA9',
    '#f1c40f',
    '#e67e22',
    '#e74c3c',
    '#9BC1ED',
    '#f39c12',
    '#d35400',
    '#c0392b',
    '#FF8EFF',
    '#45C7C6'
  ];

  private static readonly disableOpacity = '0.6';

  static buildButton(title: string, iconType: string, onClick: () => void): HTMLElement {
    const container = HtmlElementRenderUtils.renderHtmlAsElement(`
      <i class="${iconType}"></i>
      <div style="margin-left: 8px">${title}</div>
    `);
    container.style.display = 'flex';
    container.style.padding = '8px';
    container.classList.add('btn-ghost');
    container.addEventListener('click', onClick);
    return container;
  }

  static renderAction(buttons: HTMLElement[], gap = 32, actionClass = ''): HTMLElement {
    const container = document.createElement('div');
    this.addClass(container, actionClass);
    container.style.display = 'flex';
    buttons.forEach((button, index) => {
      container.append(button);
      if (index !== 0) {
        button.style.marginLeft = `${gap}px`;
      }
    });
    return container;
  }

  static addClickEvent(parent: HTMLElement, selector: string, onClick: (event: MouseEvent) => void) {
    const pathElement: Element | null = parent.querySelector(selector);
    // @ts-ignore
    pathElement?.addEventListener('click', onClick);
  }

  static buildTextColor(text: string, color: string): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('text-truncate');
    container.innerHTML = text;
    container.style.color = color;
    return container;
  }

  /**
   * Render textHtml to html as a string
   * @param textHtml
   */
  static renderDivAsString(textHtml: string, classHtml = ''): string {
    return `<div class="${classHtml}">${textHtml}</div>`;
  }

  static renderImgAsString(iconSource: string, classHtml = ''): string {
    const img = document.createElement('img');
    img.src = iconSource;
    img.alt = '';
    img.id = RandomUtils.nextString();
    HtmlElementRenderUtils.addClass(img, classHtml);
    return img.outerHTML;
  }

  static renderImg(iconSource: string, classHtml = '', defaultSrc?: string): HTMLElement {
    const img = document.createElement('img');
    img.src = iconSource;
    img.alt = '';
    img.classList.add('unselectable');
    HtmlElementRenderUtils.addClass(img, classHtml);
    if (defaultSrc) {
      img.onerror = function(event: any) {
        event.target.onerror = null;
        event.target.src = defaultSrc;
      };
    }
    return img;
  }

  static renderText(text: string, tag = 'div', classHtml = '', disabled = false, defaultText = '--'): HTMLElement {
    const element = document.createElement(tag);
    HtmlElementRenderUtils.addClass(element, classHtml);
    element.innerText = StringUtils.isNotEmpty(text) ? text : defaultText;
    if (disabled) {
      element.style.opacity = this.disableOpacity;
    }
    return element;
  }

  static renderHtmlAsElement(text: string, tag = 'span', classHtml = ''): HTMLElement {
    const element = document.createElement(tag);
    HtmlElementRenderUtils.addClass(element, classHtml);
    element.innerHTML = text;
    return element;
  }

  static addClass(element: HTMLElement, classHtml: string) {
    if (classHtml) {
      element.classList.add(...classHtml.split(' '));
    }
  }

  static renderIcon(classIcon: string, click?: (event: MouseEvent) => void): HTMLElement {
    const element = document.createElement('i');
    HtmlElementRenderUtils.addClass(element, classIcon);
    if (click) {
      element.addEventListener('click', click);
    }
    return element;
  }

  static renderAvatarAsDataUrl(text: string): string | undefined {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (context) {
      canvas.width = 256;
      canvas.height = 256;

      // Draw background
      context.fillStyle = HtmlElementRenderUtils.getBackgroundColor(text.charAt(0));
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw text
      context.font = 'bold 128px Roboto';
      // context
      context.fillStyle = '#fff';
      context.textAlign = 'center';
      // context.textBaseline = 'middle';
      context.fillText(text.charAt(0).toUpperCase(), canvas.width / 2, canvas.height / 1.5);

      return canvas.toDataURL('image/png');
    }
  }

  static renderUserPropertyTag(text: string, iconSrc: string): Promise<string> {
    const canvas = document.createElement('canvas');
    const promise: Promise<string> = new Promise<string>((resolve, reject) => {
      try {
        const context = canvas.getContext('2d');
        if (context) {
          context.font = '26px sans-serif';
          canvas.width = context.measureText(text).width + 64 + 8;
          canvas.height = 52;

          // Draw background
          context.fillStyle = '#fff';
          context.fillRect(0, 0, canvas.width, canvas.height);

          const img: HTMLImageElement = document.createElement('img');
          img.src = iconSrc;
          img.onload = function() {
            try {
              context.drawImage(img, 16, 10, 28, 28);
              // context
              context.font = '26px sans-serif';

              context.fillStyle = '#000';
              context.textAlign = 'left';
              // context.textBaseline = 'middle';
              context.fillText(text, 56, canvas.height / 1.5);
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              Log.error('HtmlElementRenderUtils::renderUserPropertyTag::error::', e);
              reject(e);
            }
          };
        }
      } catch (e) {
        reject(e);
        Log.error('HtmlElementRenderUtils::renderUserPropertyTag::error::', e);
      }
    });
    return promise;
  }

  static renderAvatar(name: string, avatarUrl?: string | null, classHtml = '', disabled = false): HTMLElement {
    const img = document.createElement('img');
    img.src = avatarUrl || HtmlElementRenderUtils.renderAvatarAsDataUrl(name) || '';
    img.alt = '';
    img.classList.add('unselectable');
    HtmlElementRenderUtils.addClass(img, classHtml);
    img.onerror = function(event: any) {
      event.target.onerror = null;
      event.target.src = HtmlElementRenderUtils.renderAvatarAsDataUrl(name);
    };
    if (disabled) {
      img.style.opacity = this.disableOpacity;
    }
    return img;
  }

  private static getBackgroundColor(text: string): string {
    const charIndex = text.toUpperCase().charCodeAt(0);
    const maxIndex = HtmlElementRenderUtils.backgrounds.length;
    return HtmlElementRenderUtils.backgrounds[charIndex % maxIndex];
  }

  static getViewport(elementID: string) {
    const elementRect = document.getElementById(elementID)?.getBoundingClientRect();
    return {
      height: elementRect?.height,
      width: elementRect?.width
    };
  }

  static getPosition(elementID: string) {
    const element = document.getElementById(elementID);
    const bodyRect = document.body.getBoundingClientRect();
    const elemRect = element?.getBoundingClientRect();
    const offsetTop = (elemRect?.top ?? 0) - bodyRect.top;
    const offsetLeft = (elemRect?.left ?? 0) - bodyRect.left;
    return { left: offsetLeft, top: offsetTop };
  }

  /**
   * fix overlap when open vue-context.
   * widget will render below or above targetId
   * @param targetId is id of button
   * @param event is native event
   * @param paddingX belong side target button
   * @param paddingY belong side target button
   */
  static fixMenuOverlap(event: Event, targetId: string, paddingX = 0, paddingY = 8): Event {
    const position = HtmlElementRenderUtils.getPosition(targetId);
    const targetViewPort = HtmlElementRenderUtils.getViewport(targetId);
    return {
      ...event,
      pageX: (position?.left ?? 0) + paddingX,
      pageY: (position?.top ?? 0) + (targetViewPort?.height ?? 0) + paddingY
    } as Event;
  }

  static fixMenuOverlapForContextMenu(event: Event, targetId: string, paddingX = 0, paddingY = 8): Event {
    const position = HtmlElementRenderUtils.getPosition(targetId);
    const targetViewPort = HtmlElementRenderUtils.getViewport(targetId);
    return {
      ...event,
      clientX: (position?.left ?? 0) + paddingX,
      clientY: (position?.top ?? 0) + (targetViewPort?.height ?? 0) + paddingY
    } as Event;
  }

  static renderCheckBox(selected: boolean, onClick: (event: MouseEvent) => void, generateId?: () => string): HTMLElement {
    const radio = document.createElement('input');
    radio.setAttribute('type', 'checkbox');
    if (generateId) {
      radio.setAttribute('id', generateId());
    }
    radio.checked = selected;
    const radioContent: HTMLElement = document.createElement('div');
    const container = document.createElement('div');
    container.addEventListener('click', onClick);
    container.appendChild(radio);
    container.appendChild(radioContent);
    HtmlElementRenderUtils.addClass(container, 'radio-cell');
    return container;
  }

  static renderBorderButton(text: string, onClick: (event: MouseEvent) => void, width?: string, height?: string): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('btn-secondary');
    button.classList.add('btn-border-accent');
    if (width) {
      button.style.width = width;
    }
    if (height) {
      button.style.height = height;
    }
    button.addEventListener('click', onClick);
    return button;
  }
  static renderPrimaryButton(text: string, onClick: (event: MouseEvent) => void, width?: string, height?: string): HTMLElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('btn-primary');
    if (width) {
      button.style.width = width;
    }
    if (height) {
      button.style.height = height;
    }
    button.addEventListener('click', onClick);
    return button;
  }
}
