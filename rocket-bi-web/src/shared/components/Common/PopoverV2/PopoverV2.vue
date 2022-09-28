<template>
  <div class="popover-container" :class="{ show: showing }">
    <button @mousedown.prevent="togglePopover" ref="reference" class="popover-reference" :class="referenceClass">
      <slot v-bind="{ togglePopover, showPopover, hidePopover, showing }"></slot>
    </button>
    <div ref="popper" class="popover-menu" tabindex="-1">
      <template v-if="optimize">
        <div @click="handleAutoHide" v-if="showing" class="popover-menu-body">
          <slot name="menu" v-bind="{ togglePopover, showPopover, hidePopover, showing }"></slot>
        </div>
      </template>
      <template v-else>
        <div @click="handleAutoHide" v-show="showing" class="popover-menu-body">
          <slot name="menu" v-bind="{ togglePopover, showPopover, hidePopover, showing }"></slot>
        </div>
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import Popper, { Modifiers, Placement } from 'popper.js';
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';

@Component
export default class PopoverV2 extends Vue {
  private showing = false;
  private popperJS: Popper | null = null;

  @Prop({ type: String, default: 'top-start' })
  private placement?: Placement;

  @Prop({ type: Boolean, default: true })
  private positionFixed?: boolean;

  @Prop({ type: Boolean, default: false })
  private autoHide?: boolean;

  @Prop({ type: [String, Object, Array], default: '' })
  private referenceClass?: string;

  @Prop({ type: Boolean, default: true })
  private optimize!: boolean;

  @Prop({ type: Boolean, default: true })
  private hideOnBackdrop!: boolean;

  private mounted() {
    window.$(document).on('mousedown touchstart', '*', this.handleClickOutside);
  }

  private destroyed() {
    window.$(document).off('mousedown touchstart', '*', this.handleClickOutside);
  }

  private getPopperOptions(modifiers?: Modifiers) {
    Log.info('getPopperOptions', this.placement);
    return {
      placement: this.placement,
      positionFixed: this.positionFixed,
      modifiers: {
        offset: {
          offset: '0, 4px'
        },
        ...(modifiers || {})
      }
    };
  }

  private handleAutoHide() {
    if (this.autoHide) {
      this.hidePopover();
    }
  }

  private handleClickOutside(e: MouseEvent) {
    if (this.hideOnBackdrop && this.showing && e.target && !window.$.contains(this.$el, e.target)) {
      this.hidePopover();
    }
  }

  private togglePopover() {
    if (this.showing) {
      this.hidePopover();
    } else {
      this.showPopover();
    }
  }

  showPopover(reference: HTMLElement | null = null, modifiers?: Modifiers) {
    if (this.showing && this.popperJS && reference) {
      this.popperJS.reference = reference;
      // this.popperJS.options = this.getPopperOptions(modifiers);
      this.popperJS.update();
    } else {
      this.showing = true;
      this.$nextTick(() => {
        this.popperJS = new Popper(reference ?? (this.$refs.reference as HTMLElement), this.$refs.popper as HTMLElement, this.getPopperOptions(modifiers));
        this.$emit('shown');
        window
          .$(this.$el)
          .find('[autofocus]')
          .first()
          .focus();
      });
    }
  }

  hidePopover() {
    this.showing = false;
    this.destroyPopperJs();
    this.$emit('hidden');
  }

  private destroyPopperJs() {
    if (this.popperJS) {
      this.popperJS.destroy();
    }
  }
}
</script>
<style lang="scss" scoped>
.popover-container {
  & > .popover-menu {
    display: none;
  }

  &.show > .popover-menu {
    display: flex;
  }
}

.popover-reference {
  background: none;
  border: none;
  outline: none;
  padding: 0;
  margin: 0;
  display: inline-block;
  text-align: left;
}

.popover-menu {
  background-color: var(--menu-background-color);
  box-shadow: var(--menu-shadow);
  border: var(--menu-border);
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  z-index: 110;
  max-width: 100vw;

  & > &-body {
    z-index: 2;

    & > .dropdown-menu {
      display: flex;
      flex-direction: column;
      position: relative;
      border: none;
      margin: 0;
    }
  }
}
</style>
