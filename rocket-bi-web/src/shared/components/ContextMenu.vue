<template>
  <div v-click-outside="vcoConfig" class="di-context-menu-container">
    <ul
      ref="contextMenu"
      v-show="isShowMenu"
      :style="{
        minWidth: minWidth,
        maxHeight: maxHeight,
        overflowY: 'auto',
        background: backgroundColor,
        zIndex: zIndex
      }"
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
        @click="event => onClickItem(event, menuItem)"
      >
        <div v-if="menuItem.icon || menuItem.iconSrc" class="menu-icon-item">
          <i
            v-if="menuItem.icon"
            :class="menuItem.icon"
            :style="{
              color: iconColor
            }"
          />
          <img v-else-if="menuItem.iconSrc" :src="menuItem.iconSrc" alt="icon" />
        </div>
        <span class="unselectable" :style="{ cursor: menuItem.cursor || 'pointer' }">
          {{ menuItem.text }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem } from '@/shared';
import { Log } from '@core/utils';

@Component
export default class ContextMenu extends Vue {
  @Prop({ type: String, default: '' })
  protected readonly minWidth?: string;

  @Prop({ type: String })
  protected readonly maxHeight?: string;

  @Prop({ type: String, default: '' })
  protected readonly backgroundColor?: string;

  @Prop({ type: String, default: '' })
  protected readonly iconColor?: string;

  @Prop({ type: String, default: '' })
  protected readonly textColor?: string;

  @Prop({ type: Array, required: false, default: () => [] })
  protected readonly ignoreOutsideClass?: string[];

  @Prop({ required: false, type: [Number, String], default: 9995 })
  protected readonly zIndex!: number;

  @Ref()
  private readonly contextMenu!: HTMLElement;

  isShowMenu = false;
  items: ContextMenuItem[] = [];

  vcoConfig: any = {
    handler: this.handler,
    middleware: this.middleware,
    events: ['click']
  };

  show(event: any, items: ContextMenuItem[]): void {
    this.items = this.parseInputDataToContextMenuItem(items);
    this.renderMenuAt({
      targetX: event.pageX,
      targetY: event.pageY
    });
  }

  showAt(target: string | HTMLElement, items: ContextMenuItem[], paddingTop = 8): void {
    this.items = this.parseInputDataToContextMenuItem(items);
    const targetElement: HTMLElement | null = typeof target === 'string' ? document.getElementById(target) : target;
    if (targetElement) {
      const domRect = targetElement.getBoundingClientRect();
      const offsetLeft = domRect.left;
      const offsetTop = domRect.top;
      this.renderMenuAt({
        targetX: offsetLeft,
        targetY: offsetTop,
        width: domRect.width,
        height: domRect.height,
        paddingTop
      });
    }
  }

  /**
   * calculate position of context menu
   *
   */
  private renderMenuAt(target: { targetX: number; targetY: number; width?: number; height?: number; paddingTop?: number }): void {
    const { targetX, targetY, width, height, paddingTop } = target;
    this.$nextTick(() => {
      this.$nextTick(() => {
        const menuElement: HTMLElement | null = this.contextMenu;
        if (menuElement) {
          let menuHeight = menuElement.offsetHeight;
          let menuWidth = menuElement.offsetWidth;

          if (menuHeight < 1 || menuWidth < 1) {
            menuElement.style.display = 'block';
            menuHeight = menuElement.offsetHeight;
            menuWidth = menuElement.offsetWidth;
          }
          const calculatedTop = this.calculatedTop(menuHeight, targetY, height, paddingTop);
          const calculatedLeft = this.calculatedLeft(menuWidth, targetX, width);

          menuElement.style.top = calculatedTop + 'px';
          menuElement.style.left = calculatedLeft + 'px';
          this.isShowMenu = true;
        }
      });
    });
  }

  public hide() {
    this.isShowMenu = false;
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

  /**
   * calculate left position of context menu.
   */
  private calculatedLeft(menuWidth: number, targetX: number, targetWidth?: number): number {
    const currentPageX = targetX - window.scrollX;
    if (currentPageX + menuWidth >= window.innerWidth) {
      // reverse position to left
      return targetX + (targetWidth ?? 0) - menuWidth;
    } else {
      return targetX;
    }
  }

  /**
   * calculate top position of context menu in window.
   * if menu height + target height + target top > window height => reverse position to top
   */
  private calculatedTop(menuHeight: number, targetY: number, targetHeight?: number, paddingTop?: number): number {
    const paddingTopValue: number = paddingTop ?? 0;
    const heightValue: number = targetHeight ?? 0;
    const currentPageY: number = targetY + heightValue - window.scrollY;
    if (menuHeight + currentPageY >= window.innerHeight) {
      // reverse position to top
      return targetY - menuHeight - paddingTopValue;
    } else {
      return targetY + heightValue + paddingTopValue;
    }
  }

  protected onClickItem(event: MouseEvent, item: ContextMenuItem): void {
    this.hide();
    this.$nextTick(() => {
      item?.click?.call(item, event);
    });
  }
}
</script>

<style lang="scss">
.di-context-menu-container {
  ul {
    background-color: var(--secondary--root);
    border: var(--menu-border);
    box-shadow: var(--menu-shadow);

    border-radius: 4px;
    display: inline-block;
    list-style-type: none;
    max-width: 18em;
    min-width: 10em;
    overflow: hidden;
    padding: 0;
    text-align: start;
    white-space: nowrap;
    position: fixed;

    li {
      padding: 10px 16px 10px 16px;

      .menu-icon-item {
        display: inline-flex;
        justify-content: center;
        width: 14px;
        height: 14px;
        margin-right: 8px;
        vertical-align: middle;
      }

      span {
        display: inline-block;
        font-weight: normal;
        font-stretch: normal;
        font-style: normal;
        line-height: inherit;
        letter-spacing: 0.2px;
        color: var(--secondary-text-color--root);
        cursor: default;
        font-size: 14px;
        vertical-align: middle;
      }

      &.disabled {
        opacity: var(--normal-opacity);
      }

      &:hover {
        background-color: var(--hover-color--root);
        cursor: context-menu;

        span {
          color: var(--text-color--root);
        }
      }
    }
  }
}
</style>
