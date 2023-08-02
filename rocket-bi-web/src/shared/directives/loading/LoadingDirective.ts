import './LoadingDirective.scss';
import { DirectiveBinding, DirectiveOptions } from 'vue/types/options';

const CONTENT = '<div class="loading-content"></div>';
const CONTAINER_CLASS = 'loading-directive';
const ANIMATED_CLASS = 'loading';

type LoadingDirectiveElement = HTMLElement & { loadingInitialed: boolean };

const LoadingDirective: DirectiveOptions = {
  bind(el: HTMLElement, binding: DirectiveBinding) {
    const loadingEl = el as LoadingDirectiveElement;
    if (loadingEl.loadingInitialed) {
      return;
    }
    loadingEl.loadingInitialed = true;
    const loadingContent = window.$(CONTENT);
    window
      .$(loadingEl)
      .addClass(CONTAINER_CLASS)
      .prepend(loadingContent);
    if (binding.value) {
      window.$(loadingEl).addClass('loading');
    } else {
      window.$(loadingEl).removeClass('loading');
    }
  },
  update(el: HTMLElement, binding: DirectiveBinding) {
    window.$(el).addClass(CONTAINER_CLASS);
    if (binding.value) {
      window.$(el).addClass('loading');
    } else {
      window.$(el).removeClass('loading');
    }
  }
};

export default LoadingDirective;
