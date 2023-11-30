<template>
  <div v-click-outside="vcoConfig" class="di-context-menu-container" @mouseleave="handleOnLeaveMenu" @mouseover="handleOnOverMenu">
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
        v-for="(menuItem, menuIndex) in items"
        :key="menuIndex"
        :id="genBtnId('context-menu', menuIndex)"
        :class="{
          disabled: menuItem.disabled,
          'di-context-menu-item-selected': hoverItem === menuItem && !menuItem.disabled && menuItem.children && menuItem.children.length !== 0
        }"
        ref="menuItems"
        :style="{
          borderBottom: menuItem.divider,
          cursor: menuItem.cursor || 'pointer'
        }"
        @click="event => onClickItem(event, menuItem)"
        v-b-hover="isHover => onHoverItem(menuItem, menuIndex, isHover)"
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
        <template v-if="menuItem.children && menuItem.children.length !== 0">
          <div class="menu-icon-children" style="rotate: 180deg">
            <i class=" di-icon-arrow-left-large"></i>
          </div>
        </template>
        <template v-else-if="menuItem.active">
          <div class="menu-icon-children menu-icon-children-active">
            <i class="di-icon-check"></i>
          </div>
        </template>
      </li>
    </ul>
    <context-menu
      v-if="isRenderSubMenu"
      ref="subContextMenu"
      :background-color="backgroundColor"
      :icon-color="iconColor"
      :ignore-outside-class="ignoreOutsideClass"
      :max-height="maxHeight"
      :min-width="minWidth"
      :text-color="textColor"
      :z-index="zIndex + 1"
      @selectItem="
        (event, item) => {
          hide();
          $emit('selectItem', event, item);
        }
      "
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem } from '@/shared';
import { ListUtils, TimeoutUtils } from '@/utils';
import { isFunction } from 'lodash';

type MenuPlacement = 'bottom' | 'right';

@Component
export default class ContextMenu extends Vue {
  protected isRenderSubMenu = false;

  protected isShowMenu = false;
  protected items: ContextMenuItem[] = [];
  protected hoverItem: ContextMenuItem | null = null;
  protected mouseLeaveTimerId: number | null = null;

  protected vcoConfig: any = {
    handler: this.handler,
    middleware: this.middleware,
    events: ['click']
  };

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

  @Ref()
  private readonly subContextMenu!: ContextMenu;

  @Ref()
  private readonly menuItems!: HTMLElement[];

  show(event: any, items: ContextMenuItem[]): void {
    this.items = this.parseToMenuItem(items);
    this.renderMenuAt({
      targetX: event.pageX,
      targetY: event.pageY
    });
  }

  showAt(target: string | HTMLElement, items: ContextMenuItem[], config: { paddingTop?: number; placement?: MenuPlacement } = {}): void {
    this.items = this.parseToMenuItem(items);
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
        ...config
      });
    }
  }

  protected onHoverItem(item: ContextMenuItem, menuIndex: number, isHover: boolean): void {
    // always select item for apply hover style
    if (this.hoverItem !== item) {
      this.isRenderSubMenu = false;
    }
    this.hoverItem = item;

    if (item.disabled) {
      return;
    }

    if (isHover && ListUtils.isNotEmpty(item.children)) {
      this.isRenderSubMenu = true;
      this.$nextTick(() => {
        this.subContextMenu.showAt(this.menuItems[menuIndex], item.children!, {
          paddingTop: 0,
          placement: 'right'
        });
      });
      return;
    }
  }

  protected handleOnLeaveMenu(): void {
    this.mouseLeaveTimerId = TimeoutUtils.waitAndExec(
      this.mouseLeaveTimerId,
      () => {
        this.hoverItem = null;
        this.isRenderSubMenu = false;
      },
      500
    );
  }

  protected handleOnOverMenu(): void {
    TimeoutUtils.clear(this.mouseLeaveTimerId);
    this.mouseLeaveTimerId = null;
  }

  /**
   * calculate position of context menu
   *
   */
  private renderMenuAt(target: { targetX: number; targetY: number; width?: number; height?: number; paddingTop?: number; placement?: MenuPlacement }): void {
    const { targetX, targetY, width, height, paddingTop, placement } = target;
    this.$nextTick(() => {
      this.$nextTick(() => {
        const contextMenu: HTMLElement | null = this.contextMenu;
        if (contextMenu) {
          let menuHeight = contextMenu.offsetHeight;
          let menuWidth = contextMenu.offsetWidth;

          if (menuHeight < 1 || menuWidth < 1) {
            contextMenu.style.display = 'block';
            menuHeight = contextMenu.offsetHeight;
            menuWidth = contextMenu.offsetWidth;
          }
          const calculatedTop = this.calculatedTop(menuHeight, targetY, height, paddingTop, placement);
          const calculatedLeft = this.calculatedLeft(menuWidth, targetX, width, placement);

          contextMenu.style.top = calculatedTop + 'px';
          contextMenu.style.left = calculatedLeft + 'px';
          this.isShowMenu = true;
        }
      });
    });
  }

  public hide() {
    this.isShowMenu = false;
    this.hoverItem = null;
  }

  private parseToMenuItem(items: ContextMenuItem[]) {
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
  private calculatedLeft(menuWidth: number, targetX: number, targetWidth?: number, placement?: MenuPlacement): number {
    const currentPageX = targetX - window.scrollX;
    const targetWidthValue: number = targetWidth ?? 0;
    switch (placement) {
      case 'right': {
        const isRevert = currentPageX + menuWidth + targetWidthValue >= window.innerWidth;
        return isRevert ? targetX - menuWidth : targetX + targetWidthValue;
      }
      case 'bottom':
      default: {
        const isRevert = currentPageX + menuWidth >= window.innerWidth;
        return isRevert ? targetX + targetWidthValue - menuWidth : targetX;
      }
    }
  }

  /**
   * calculate top position of context menu in window.
   * if menu height + target height + target top > window height => reverse position to top
   */
  private calculatedTop(menuHeight: number, targetY: number, targetHeight?: number, paddingTop?: number, placement?: MenuPlacement): number {
    const paddingTopValue: number = paddingTop ?? 0;
    const targetHeightValue: number = targetHeight ?? 0;
    switch (placement) {
      case 'right': {
        const currentY = targetY - window.scrollY;
        const isRevert = currentY + menuHeight + paddingTopValue >= window.innerHeight;
        return isRevert ? targetY - menuHeight - paddingTopValue : targetY + paddingTopValue;
      }
      case 'bottom':
      default: {
        const startTop: number = targetY + targetHeightValue - window.scrollY;
        const isRevert = startTop + menuHeight + paddingTopValue >= window.innerHeight;
        return isRevert ? targetY - menuHeight - paddingTopValue : targetY + targetHeightValue + paddingTopValue;
      }
    }
  }

  protected onClickItem(event: MouseEvent, item: ContextMenuItem): void {
    this.hoverItem = item;
    // force hide context menu if item item has no children or has click event
    if (ListUtils.isEmpty(item.children)) {
      this.hide();
      this.$emit('selectItem', item, event);
      this.$nextTick(() => {
        item?.click?.call(item, event);
      });
    } else {
      event.stopPropagation();
    }
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
      padding: 12px 16px;
      display: flex;
      align-items: center;
      overflow: hidden;

      .menu-icon-item {
        display: inline-flex;
        justify-content: center;
        width: 18px;
        height: 18px;
        font-size: 16px;
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
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .menu-icon-children {
        display: inline-flex;
        justify-content: center;
        width: 14px;
        height: 14px;
        margin-left: 8px;
        vertical-align: middle;

        &.menu-icon-children-active {
          color: var(--accent);
        }
      }

      &.disabled {
        opacity: var(--normal-opacity);
      }

      &.di-context-menu-item-selected,
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
