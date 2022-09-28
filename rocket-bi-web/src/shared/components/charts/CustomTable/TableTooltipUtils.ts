/*
 * @author: tvc12 - Thien Vi
 * @created: 6/22/21, 7:56 PM
 */

export class TableTooltipUtils {
  private static readonly tooltipId = 'di-tooltip';

  static hideTooltip() {
    const $ = window.$;
    $(`#${TableTooltipUtils.tooltipId}`).hide();
  }

  static configTooltip(element: HTMLElement) {
    const $ = window.$;
    if (element.hasAttribute('data-title')) {
      $(element)
        .hover(
          function() {
            const currentElement = $(element);
            const css = TableTooltipUtils.getTooltipCss(element);
            $(`#${TableTooltipUtils.tooltipId}`)
              .css(css)
              .text(currentElement.attr('data-title'))
              .stop(true, true)
              .delay(1000)
              .fadeIn({ duration: 250 });
          },
          function() {
            $(`#${TableTooltipUtils.tooltipId}`)
              .stop(true, true)
              .fadeOut(50);
          }
        )
        .mousemove(function(event: MouseEvent) {
          const tooltipElement = $(`#${TableTooltipUtils.tooltipId}`);
          const top = TableTooltipUtils.calculatedTop(tooltipElement.height(), event);
          const left = TableTooltipUtils.calculatedLeft(tooltipElement.width(), event);
          tooltipElement.css({ top: top, left: left });
        })
        .click(function() {
          $(`#${TableTooltipUtils.tooltipId}`)
            .stop(true, true)
            .hide();
        });
    }
  }

  static initTooltip() {
    window.$ = require('jquery');
    const tooltipElement = document.createElement('div');
    tooltipElement.classList.add('custom-table-tooltip');
    tooltipElement.style.display = 'none';
    tooltipElement.id = TableTooltipUtils.tooltipId;
    document.body.append(tooltipElement);
  }

  private static calculatedLeft(width: number, event: MouseEvent, offset = 15) {
    const currentPageX = event.pageX - window.scrollX;
    if (width + currentPageX >= window.innerWidth) {
      return event.pageX - width - offset;
    } else {
      return event.pageX + offset;
    }
  }

  private static calculatedTop(height: number, event: MouseEvent, offset = 15) {
    const currentPageY = event.pageY - window.scrollY;
    if (height + currentPageY >= window.innerHeight) {
      return event.pageY - height - offset;
    } else {
      return event.pageY + offset;
    }
  }

  private static getTooltipCss(element: HTMLElement): any {
    const elementStyles: CSSStyleDeclaration = getComputedStyle(element);
    const css = {
      '--tooltip-background-color': elementStyles.getPropertyValue('--tooltip-background-color'),
      '--tooltip-color': elementStyles.getPropertyValue('--tooltip-color'),
      '--tooltip-font-family': elementStyles.getPropertyValue('--tooltip-font-family'),
      '--tooltip-font-size': elementStyles.getPropertyValue('--tooltip-font-size')
    };
    return css;
  }
}
