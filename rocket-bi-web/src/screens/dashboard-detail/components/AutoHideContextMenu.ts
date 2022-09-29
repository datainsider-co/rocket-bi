/*
 * @author: tvc12 - Thien Vi
 * @created: 7/21/21, 10:41 AM
 */

import { Component, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import { isNumber } from 'lodash';
// Class for auto hide context menu when scroll
// @ts-ignore
@Component
export abstract class AutoHideContextMenu extends Vue {
  // by px
  protected maxScrollPx = 150;
  private currentScrollTop: null | number = null;
  private currentScrollLeft: null | number = null;

  abstract hide(): void;

  protected onBodyScroll(vertical: any, horizontal: any) {
    if (isNumber(this.currentScrollTop)) {
      const isOverflow = Math.abs(this.currentScrollTop - vertical.scrollTop) > this.maxScrollPx;
      if (isOverflow) {
        this.hide();
        return;
      }
    } else {
      this.currentScrollTop = vertical.scrollTop;
    }

    if (isNumber(this.currentScrollLeft)) {
      const isOverflow = Math.abs(this.currentScrollLeft - horizontal.scrollLeft) > this.maxScrollPx;
      if (isOverflow) {
        this.hide();
        return;
      }
    } else {
      this.currentScrollLeft = vertical.scrollLeft;
    }
  }

  protected listenScroll() {
    this.currentScrollTop = null;
    this.currentScrollLeft = null;
    this.$root.$on('body-scroll', this.onBodyScroll);
  }

  protected removeListenScroll() {
    this.$root.$off('body-scroll', this.onBodyScroll);
  }
}
