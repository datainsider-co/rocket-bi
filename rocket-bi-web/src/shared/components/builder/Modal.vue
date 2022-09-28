<template>
  <SlideYUpTransition :duration="animationDuration">
    <div
      class="modal fade hide"
      @click.self="handleClickBackdrop"
      :class="[{ 'show d-block': show }, { 'd-none': !show }, { 'modal-mini': type === 'mini' }]"
      v-if="show"
      tabindex="-1"
      role="dialog"
      aria-hidden="true"
      data-backdrop="static"
    >
      <div class="modal-dialog" :class="[{ 'modal-notice': type === 'notice' }, { 'modal-dialog-centered': centered }, modalClasses]">
        <div class="modal-content" :class="[gradient ? `bg-gradient-${gradient}` : '', modalContentClasses]">
          <div class="modal-header" :class="[headerClasses]" v-if="$slots.header">
            <slot name="header"></slot>
            <slot name="close-button">
              <button type="button" class="close" v-if="showClose" @click="closeModal" data-dismiss="modal" aria-label="Close">
                <CloseIcon class="btn-ghost ic-16"></CloseIcon>
              </button>
            </slot>
          </div>

          <div v-if="$slots.default" class="modal-body" :class="bodyClasses">
            <slot></slot>
          </div>

          <div class="modal-footer" :class="footerClasses" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </div>
  </SlideYUpTransition>
</template>
<script lang="ts">
import { SlideYUpTransition } from 'vue2-transitions';

import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

@Component({
  components: {
    SlideYUpTransition
  }
})
export default class Modal extends Vue {
  @Prop({ type: Boolean })
  show!: boolean;

  @Prop({
    type: Boolean,
    default: true
  })
  showClose!: boolean;

  @Prop({
    type: Boolean,
    default: true,
    required: false
  })
  hideOnBackdropClick!: boolean;

  @Prop({
    type: Boolean,
    default: true
  })
  centered!: boolean;

  // 'Modal type (notice|mini|"") ',
  @Prop({
    type: String,
    default: '',
    validator(value) {
      const acceptedValues = ['', 'notice', 'mini'];
      return acceptedValues.indexOf(value) !== -1;
    }
  })
  type!: string;

  // 'Modal dialog css classes'
  @Prop({
    type: [Object, String]
  })
  modalClasses!: [object, string];

  // 'Modal dialog content css classes'
  @Prop({
    type: [Object, String]
  })
  modalContentClasses!: [object, string];

  // 'Modal gradient type (danger, primary etc)'
  @Prop({
    type: String
  })
  gradient!: string;

  // 'Modal Header css classes'
  @Prop({
    type: [Object, String]
  })
  headerClasses!: [object, string];

  // 'Modal Body css classes'
  @Prop({
    type: [Object, String]
  })
  bodyClasses!: [object, string];

  // 'Modal Footer css classes'
  @Prop({
    type: [Object, String]
  })
  footerClasses!: [object, string];

  // 'Modal transition duration'
  @Prop({
    type: Number,
    default: 500
  })
  animationDuration!: number;

  @Watch('show')
  onShowChanged(val: any) {
    const documentClasses = document.body.classList;
    if (val) {
      documentClasses.add('modal-open');
      document.addEventListener('keydown', this.handleKeyDown);
    } else {
      documentClasses.remove('modal-open');
      document.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  created() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown(e: KeyboardEvent) {
    const code: string | number = e.key || e.which;
    if (code === 'Escape') {
      this.closeModal();
    }
  }

  closeModal() {
    this.$emit('update:show', false);
    this.$emit('close');
  }

  handleClickBackdrop() {
    if (this.hideOnBackdropClick) {
      this.closeModal();
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';

.modal {
  background-color: rgba(#131317, 0.7);
}
</style>
