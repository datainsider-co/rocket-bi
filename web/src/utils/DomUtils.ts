/*
 * @author: tvc12 - Thien Vi
 * @created: 5/8/21, 12:09 PM
 */

export class DomUtils {
  static bind(key: string, data: any): void {
    // @ts-ignored
    window[`${key}`] = data;
  }

  static bindCssVariable(element: HTMLElement, style: any) {
    Object.entries(style).forEach(([key, value]: any) => {
      element.style.setProperty(key, value);
    });
  }

  static unbindCssVariable(element: HTMLElement, style: any) {
    Object.entries(style).forEach(([key, _]: any) => {
      element.style.removeProperty(key);
    });
  }
}
