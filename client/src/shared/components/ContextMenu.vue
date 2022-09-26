<template>
  <div v-click-outside="vcoConfig" class="di-context-menu-container">
    <ul
      v-show="menuShow"
      :style="{
        minWidth: minWidth,
        maxHeight: maxHeight,
        overflowY: 'auto',
        background: backgroundColor,
        zIndex: zIndex
      }"
      :id="id"
    >
      <slot></slot>
      <li
        v-for="(menuItem, index) in items"
        :id="genBtnId('context-menu', index)"
        v-bind:key="index"
        :class="{
          disabled: menuItem.disabled
        }"
        :style="{
          borderBottom: menuItem.divider,
          cursor: menuItem.cursor || 'pointer'
        }"
        @click="menuItem.click"
      >
        <span
          :style="{
            cursor: menuItem.cursor || 'pointer'
          }"
          >{{ menuItem.text }}</span
        >
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ContextMenuItem } from '@/shared';

@Component
export default class ContextMenu extends Vue {
  @Prop({ type: String, default: 'di-context-menu' })
  private readonly id!: string;

  @Prop({
    type: String,
    default: ''
  })
  minWidth?: string;

  @Prop({
    type: String
  })
  maxHeight?: string;

  @Prop({
    type: String,
    default: ''
  })
  backgroundColor?: string;

  @Prop({
    type: String,
    default: ''
  })
  iconColor?: string;

  @Prop({
    type: String,
    default: ''
  })
  textColor?: string;

  @Prop({
    type: Array,
    required: false,
    default: () => []
  })
  ignoreOutsideClass?: string[];

  @Prop()
  zIndex!: number;

  menuShow = false;
  items: ContextMenuItem[] = [];

  vcoConfig: any = {
    handler: this.handler,
    middleware: this.middleware,
    events: ['click']
  };

  show(event: any, items: ContextMenuItem[]) {
    this.items = this.parseInputDataToContextMenuItem(items);
    this.$nextTick(() => {
      const menuElement: HTMLElement | null = document.getElementById(this.id);
      if (menuElement) {
        let menuHeight = menuElement.offsetHeight;
        let menuWidth = menuElement.offsetWidth;

        if (menuHeight < 1 || menuWidth < 1) {
          menuElement.style.display = 'block';
          menuHeight = menuElement.offsetHeight;
          menuWidth = menuElement.offsetWidth;
        }

        menuElement.style.left = this.calculatedLeft(menuWidth, event) + 'px';
        menuElement.style.top = this.calculatedTop(menuHeight, event) + 'px';
        this.menuShow = true;
      }
    });
  }

  public hide() {
    this.menuShow = false;
  }

  private parseInputDataToContextMenuItem(items: ContextMenuItem[]) {
    for (const i in items) {
      items[i].textColor = this.textColor;
      if (typeof items[i].click !== 'function') {
        items[i].click = () => null;
      }

      if (items[i].disabled) {
        items[i].click = () => null;
        items[i].cursor = 'not-allowed';
        items[i].textColor = 'var(--text-color)';
      }

      if (items[i].divider) {
        items[i].divider = '1px solid #ebebeb';
      }
    }
    return items;
  }

  private handler(event: any) {
    let className = event.target.className;
    const parentClassName = event.target.parentNode?.className ?? '';
    if (!(typeof className === 'string' || className instanceof String)) {
      className = className.baseVal;
    }
    if (
      className === '' ||
      typeof parentClassName === 'object' ||
      (!this.ignoreOutsideClass?.some(s => parentClassName?.includes(s)) && !this.ignoreOutsideClass?.some(s => className?.includes(s)))
    ) {
      this.hide();
    }
  }

  private middleware(event: any) {
    return event.target.className !== 'di-context-menu-container';
  }

  private calculatedLeft(menuWidth: number, event: MouseEvent) {
    const currentPageX = event.pageX - window.scrollX;
    if (menuWidth + currentPageX >= window.innerWidth) {
      return event.pageX - menuWidth;
    } else {
      return event.pageX;
    }
  }

  private calculatedTop(menuHeight: number, event: MouseEvent) {
    const currentPageY = event.pageY - window.scrollY;
    if (menuHeight + currentPageY >= window.innerHeight) {
      return event.pageY - menuHeight;
    } else {
      return event.pageY;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/di-variables';

.di-context-menu-container {
  z-index: 9995;
}

.di-context-menu-container ul {
  background-color: var(--menu-background-color);
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);

  border-radius: 4px;
  display: inline-block;
  list-style-type: none;
  max-width: 18em;
  min-width: 10em;
  overflow: hidden;
  padding: 0;
  position: absolute;
  text-align: start;
  white-space: nowrap;
}

.di-context-menu-container ul li {
  padding: 10px 16px 10px 16px;

  span {
    color: var(--secondary-text-color);
  }

  &.disabled {
    opacity: var(--normal-opacity);
  }
}

.di-context-menu-container ul li:hover {
  background-color: var(--hover-color);
  cursor: context-menu;
  span {
    color: var(--text-color);
  }
}

.di-context-menu-container ul span {
  display: inline-block;
  @include regular-text;
  font-size: 14px;
  //opacity: 0.8;
}
</style>
