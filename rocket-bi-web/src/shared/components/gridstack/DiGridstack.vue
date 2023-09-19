<template>
  <div class="grid-stack-container">
    <div ref="temps" style="display: none">
      <slot></slot>
    </div>
    <div ref="gs" class="grid-stack"></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Provide, Ref, Vue, Watch, Inject } from 'vue-property-decorator';
import { GridStack, GridStackElement, GridStackNode, GridStackWidget } from 'gridstack';
import { GridItemHTMLElement } from 'gridstack/dist/types';
// @ts-ignored
import GridstackOverlapping from './GridstackOverlapping';
import { CustomGridstack, CustomGridStackOptions } from '@/shared/components/gridstack/CustomGridstack';
import { ChartUtils } from '@/utils';
import { WidgetId } from '@core/common/domain';
import { EventBus } from '@/event-bus/EventBus';

GridstackOverlapping(GridStack);

@Component
export default class DiGridstack extends Vue {
  instance: CustomGridstack | null = null;
  pre: {
    el: string | HTMLElement;
    options?: GridStackWidget;
  }[] = [];
  @Ref()
  gs!: HTMLElement;
  @Prop({ required: true, default: {} })
  private readonly options!: CustomGridStackOptions;
  @Prop({ default: false, type: Boolean })
  private readonly canInteractive!: boolean;

  @Provide('buildGridstackItemId')
  buildGridstackItemId(id: WidgetId): string {
    return `${id}-grid-stack-item`;
  }

  @Inject({ default: () => ChartUtils.isMobile() })
  protected getIsMobile!: () => boolean;

  private get column(): number {
    return 48;
  }

  created() {
    EventBus.onDashboardResize(this.handleResize);
  }

  destroyed() {
    EventBus.offDashboardResize(this.handleResize);
  }

  handleResize(isMobile: boolean): void {
    this.$nextTick(() => {
      const grid = this.instance;
      if (!grid) {
        return;
      }
      if (isMobile) {
        this.showMobileMode(grid);
      } else {
        this.showDesktopMode(grid, this.options.enableOverlap || false);
      }
    });
  }

  mounted() {
    this.$nextTick(() => {
      // @ts-ignored
      this.instance = GridStack.customInit(this.options, this.gs) as CustomGridstack;

      this.instance.batchUpdate();
      this.instance.column(this.column);
      this.configMargin(this.instance, this.options.enableOverlap || false, this.options.margin);
      this.instance.on('change', this.handleItemChange);
      this.instance.on('added', this.handleItemChange);

      while (this.pre.length > 0) {
        const args = this.pre.shift();
        if (args) {
          this.addItem(args.el, args.options);
        }
      }

      if (this.canInteractive) {
        this.enable();
      } else {
        this.disable();
      }
      this.instance.commit();

      this.handleResize(this.getIsMobile());
    });
  }

  @Watch('canInteractive')
  onCanInteractiveChanged() {
    if (this.canInteractive) {
      this.enable();
    } else {
      this.disable();
    }
  }
  public updateItem(id: WidgetId, width: number, height: number) {
    const gridItem: GridItemHTMLElement | undefined = this.getGridItemById(id);
    if (gridItem) {
      this.instance?.update(gridItem, undefined, undefined, width, height);
    }
  }

  @Provide()
  addItem(el: GridStackElement, options?: GridStackWidget) {
    if (this.instance) {
      this.instance.addWidget(el, options);
    } else {
      this.pre.push({
        el: el,
        options: options
      });
    }
  }

  @Provide()
  removeItem(els: GridStackElement, removeDOM?: boolean, triggerEvent?: boolean) {
    if (this.instance) {
      this.instance.removeWidget(els, removeDOM, triggerEvent);
    }
  }

  getGridItemById(id: WidgetId): GridItemHTMLElement | undefined {
    if (this.instance) {
      return this.instance.getGridItems().find(item => item.id === this.buildGridstackItemId(id));
    } else {
      return undefined;
    }
  }

  removeItemById(id: WidgetId) {
    const gridItem: GridItemHTMLElement | undefined = this.getGridItemById(id);
    if (gridItem) {
      this.instance?.removeWidget(gridItem);
    }
  }

  disable() {
    if (this.instance) {
      this.instance.disable();
    }
  }

  enable() {
    if (this.instance) {
      this.instance.enable();
    }
  }

  @Watch('options.enableOverlap')
  private handleEnableOverlapChanged(enableOverlap: boolean): void {
    if (ChartUtils.isDesktop() && this.instance) {
      this.instance.batchUpdate();
      this.configMargin(this.instance, enableOverlap, this.options.margin);
      this.instance.engine.setEnableOverlap(enableOverlap);
      this.instance.float(enableOverlap);
      this.compact(this.instance, enableOverlap);
      this.instance.commit();
    }
  }

  showDesktopMode(grid: CustomGridstack, enableOverlap: boolean) {
    grid.batchUpdate();
    this.configMargin(grid, enableOverlap, this.options.margin);
    grid.engine.setEnableOverlap(enableOverlap);
    grid.column(this.column);
    grid.commit();
  }

  showMobileMode(grid: CustomGridstack) {
    grid.batchUpdate();
    this.configMargin(grid, false, this.options.margin);
    grid.engine.setEnableOverlap(false);
    grid.column(1);
    grid.commit();
  }

  private handleItemChange(event: Event, items?: GridItemHTMLElement | GridStackNode[]) {
    if (items && Array.isArray(items)) {
      items.forEach((item: GridStackNode) => {
        this.processItemChange(item);
      });
    }
  }

  private processItemChange(item: GridStackNode) {
    const onChangeFn = (item.el as any)?.$gsChange;
    if (typeof onChangeFn === 'function') {
      onChangeFn(item);
    }
  }

  private configMargin(gridstack: CustomGridstack, enableOverlap: boolean, margin: any) {
    // if (enableOverlap) {
    //   // gridstack.margin('0px');
    // } else {
    //   // gridstack.margin(margin);
    // }
    gridstack.margin(margin);
  }

  compact(instance: CustomGridstack, enableOverlap: boolean) {
    if (!enableOverlap) {
      instance.compact();
    }
  }
}
</script>

<style lang="scss" src="@/themes/scss/gridstack.scss"></style>
