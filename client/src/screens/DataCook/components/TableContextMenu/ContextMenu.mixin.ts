import { Component, Vue } from 'vue-property-decorator';

const OFFSET = 8;

@Component({})
export default class ContextMenuMixin extends Vue {
  private mounted() {
    window.$(document).on('mousedown touchstart', '*', this.handleClickOutside);
  }

  private destroyed() {
    window.$(document).off('mousedown touchstart', '*', this.handleClickOutside);
  }

  private handleClickOutside(e: MouseEvent) {
    if (e.target && !window.$.contains(this.$el, e.target)) {
      this.hide();
    }
  }

  public show(top: number, left: number) {
    const el: HTMLElement = this.$el as HTMLElement;

    el.style.visibility = 'hidden';
    this.$el.classList.add('show');
    const wWidth = Math.min(window.innerWidth, window.outerWidth); // window.$(window).width();
    const wHeight = Math.min(window.innerHeight, window.outerHeight); // window.$(window).height();
    const finalTop = Math.min(top, wHeight - this.$el.scrollHeight - OFFSET);
    const finalLeft = Math.min(left, wWidth - this.$el.scrollWidth - OFFSET);

    el.style.top = finalTop + 'px';
    el.style.left = finalLeft + 'px';
    el.style.visibility = 'visible';
  }

  public hide() {
    this.$el.classList.remove('show');
  }
}
