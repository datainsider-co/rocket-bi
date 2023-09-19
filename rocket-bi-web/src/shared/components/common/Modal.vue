<template>
  <div class="modal fade" role="dialog">
    <div :class="sizeClass" :style="customWidthStyle" class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div :class="headerClass" class="modal-header" v-if="!hideHeader">
          <slot name="header">
            <h3 class="modal-title">{{ title }}</h3>
          </slot>
          <slot name="header-action" :hide="hide">
            <button @click.prevent="hide" aria-label="Close" class="close" type="button" v-if="!hideCloseBtn">
              <img src="@/assets/icon/ic_close.svg" alt="" />
              <!--              <span aria-hidden="true">&times;</span>-->
            </button>
          </slot>
        </div>
        <div :class="bodyClass" class="modal-body">
          <slot></slot>
        </div>
        <div :class="footerClass" class="modal-footer justify-content-start" v-if="!hideFooter">
          <slot name="footer" v-bind="{ hide }">
            <button @click.prevent="hide" class="btn btn-secondary">Close</button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import * as $ from 'jquery';
// const $ = window.$;
import 'bootstrap/dist/js/bootstrap.bundle.js';

export default {
  name: 'Modal',
  model: {
    prop: 'open',
    modalEl: null
  },
  props: {
    title: {
      type: String,
      default: ''
    },
    keyboard: {
      type: Boolean,
      default: true
    },
    backdrop: {
      type: [Boolean, String],
      default: true
    },
    focus: {
      type: Boolean,
      default: true
    },
    open: {
      type: Boolean,
      default: false
    },
    bodyClass: {
      type: [String, Object],
      default: ''
    },
    headerClass: {
      type: [String, Object],
      default: 'dark'
    },
    footerClass: {
      type: [String, Object],
      default: ''
    },
    hideFooter: {
      type: Boolean,
      default: false
    },
    hideCloseBtn: {
      type: Boolean,
      default: false
    },
    hideHeader: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: ''
    },
    modalClass: {
      type: String,
      default: ''
    },
    showAtBody: {
      type: Boolean,
      default: false
    },
    width: {
      type: Number
    },
    disableScrollH: Boolean
  },
  data() {
    return {
      opened: false
    };
  },
  computed: {
    sizeClass() {
      return `modal-${this.size} ${this.modalClass}`;
    },
    customWidthStyle() {
      if (this.width > 0) {
        return {
          width: 'calc(100% - 40px)',
          maxWidth: this.width + 'px'
        };
      }
      return {};
    }
  },
  watch: {
    keyboard() {
      this.applyOptions();
    },
    backdrop() {
      this.applyOptions();
    },
    focus() {
      this.applyOptions();
    },
    open(value) {
      this.opened = value;
      this.applyOptions();
    }
  },
  mounted() {
    if (this.open !== undefined) {
      this.opened = this.open;
    }
    $(this.$el)
      .on('show.bs.modal', this.processOnShow)
      .on('shown.bs.modal', this.processOnShown)
      .on('hide.bs.modal', this.processOnHide)
      .on('hidden.bs.modal', this.processOnHidden);

    $(this.$el).on('click', '[data-dismiss=modal]', e => {
      e.stopImmediatePropagation();
    });
    this.applyOptions();
    if (!this.modalEl) {
      this.modalEl = this.showAtBody ? $(this.$el).appendTo('body') : $(this.$el);
    }
    $(this.$el).on('mousewheel', this.handleMouseWheel);
  },
  destroyed: function() {
    $(this.$el).off('mousewheel', this.handleMouseWheel);
    if (this.modalEl) {
      this.modalEl.remove();
      this.modalEl = null;
    }
    this.hide();
  },
  methods: {
    applyOptions() {
      $(this.$el).modal({
        keyboard: this.keyboard,
        backdrop: this.backdrop,
        focus: this.focus,
        show: this.opened
      });

      if (this.opened) {
        $(this.$el).modal('show');
      } else {
        $(this.$el).modal('hide');
      }
    },
    show() {
      this.opened = true;
      this.applyOptions();
      this.$emit('input', this.opened);
    },
    hide() {
      return new Promise(resolve => {
        $(this.$el).one('hidden.bs.modal', () => {
          resolve(true);
        });
        this.opened = false;
        $(this.$el).modal('hide');
      });
    },
    toggle() {
      this.opened = !this.opened;
      $(this.$el).modal('toggle');
    },
    processOnShow(...args) {
      this.$emit('show', ...args);
    },
    processOnShown(...args) {
      this.opened = true;
      this.$emit('input', this.opened);

      $(this.$el)
        .find('[autofocus]')
        .first()
        .focus();
      $('body').removeClass('modal-open');
      setTimeout(function() {
        $('body').addClass('modal-open');
      }, 0);
      this.$emit('shown', ...args);
    },
    processOnHide(...args) {
      this.$emit('hide', ...args);
    },
    processOnHidden(...args) {
      this.opened = false;
      this.$emit('input', this.opened);
      if ($('.modal.show').length > 0) {
        $('body').addClass('modal-open');
      } else {
        $('body').removeClass('modal-open');
      }
      this.$emit('hidden', ...args);
    },
    handleMouseWheel(e) {
      if (this.disableScrollH && e.deltaX !== 0) {
        e.preventDefault();
      }
    }
  }
};
</script>
