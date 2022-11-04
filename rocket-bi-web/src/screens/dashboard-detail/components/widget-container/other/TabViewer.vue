<template>
  <div class="tab-viewer-container" :style="tabStyle" :class="containerClass">
    <b-card no-body style="overflow: hidden">
      <b-tabs v-model="tabIndex" lazy card no-fade :nav-wrapper-class="navClass" active-nav-item-class="active-tab-class" :vertical="isVerticalTab">
        <!-- Render Tabs Title -->
        <b-tab v-for="(tab, index) in widget.tabItems" :key="'tab-' + index">
          <template #title>
            <div class="d-flex align-items-center tab-header-title" :style="headerStyle">
              <div>{{ tab.name }}</div>
              <transition name="fade">
                <template v-if="isShowEdit">
                  <b-icon-three-dots-vertical
                    :id="genBtnId(`config-tab-${widget.id}-${index}`)"
                    class="ic-16 icon-config-tab"
                    @click.stop="clickConfigTab(...arguments, index)"
                  ></b-icon-three-dots-vertical>
                </template>
              </transition>
            </div>
          </template>
          <template v-if="isShowComponent">
            <!-- Empty -->
            <template v-if="currentWidgetIds.length === 0">
              <div class="text-info h-100 w-100 d-flex flex-column align-items-center justify-content-center">
                Your tab is empty<br />
                <div><b href="#" @click="handleAddChartToTab(index)">Click here</b> to add</div>
              </div>
            </template>
            <!-- Content -->
            <vuescroll v-else>
              <DiGridstack ref="gridstacks" :canInteractive="isShowEdit" :options="defaultOptions">
                <template v-for="(position, id) in positions">
                  <DiGridstackItem
                    :id="+id"
                    :key="id"
                    :height="position.height"
                    :width="position.width"
                    :x="position.column"
                    :y="position.row"
                    :zIndex="position.zIndex"
                    @change="handleChangePosition"
                  >
                    <div :style="{ cursor: getCurrentCursor }" class="grid-item-container">
                      <WidgetContainer :isShowEdit="isShowEdit" :widget="getWidget(id)" :id="`${id}-chart-holder`" />
                    </div>
                  </DiGridstackItem>
                </template>
              </DiGridstack>
            </vuescroll>
          </template>
        </b-tab>

        <template #tabs-end>
          <div class="tab-end-container">
            <!-- Select Tab Button (Using tabs-end slot) -->
            <b-nav-item
              v-if="widget.tabItems.length >= 3"
              @click.stop="clickSelectTab"
              href="#"
              class="icon-config-widget"
              :id="genBtnId(`select-tab-${widget.id}`)"
            >
              <div :style="headerStyle">
                <i class="di-icon-arrow-down icon-title" />
              </div>
            </b-nav-item>
            <!-- New Tab Button (Using tabs-end slot) -->
            <b-nav-item
              v-if="isShowAdd && isShowEdit"
              @click.stop="clickConfigWidget"
              href="#"
              class="icon-config-widget"
              :id="genBtnId(`config-widget-${widget.id}`)"
            >
              <div :style="headerStyle">
                <i class="di-icon-setting icon-title" />
              </div>
            </b-nav-item>
          </div>
        </template>

        <!-- Render this if no tabs -->
        <template #empty>
          <div class="text-info h-100 w-100 d-flex flex-column align-items-center justify-content-center">
            There are no open tabs<br />
            <div><b href="#" @click="handleAddTab">Click here</b> to add your first tab</div>
          </div>
        </template>
      </b-tabs>
    </b-card>
    <DiRenameModal ref="renameModal" @rename="handleRenameTab" />
  </div>
</template>

<script lang="ts">
import SortModal from '@/screens/dashboard-detail/components/SortModal.vue';
import WidgetContainer from '@/screens/dashboard-detail/components/widget-container';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { ContextMenuItem } from '@/shared';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { CustomGridStackOptions } from '@/shared/components/gridstack/CustomGridstack';
import DiGridstack from '@/shared/components/gridstack/DiGridstack.vue';
import DiGridstackItem from '@/shared/components/gridstack/DiGridstackItem.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { GenIdMethods } from '@/utils/IdGenerator';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIMap, Position, TabWidget, Widget, WidgetId, Tab } from '@core/common/domain';
import { DashboardService } from '@core/common/services';
import { cloneDeep, isNumber } from 'lodash';
import { Component, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import Swal from 'sweetalert2';
import { Log } from '@core/utils';
import { DomUtils, ListUtils } from '@/utils';

@Component({ components: { WidgetContainer, DiGridstack, DiGridstackItem, DiRenameModal, SortModal } })
export default class TabViewer extends Vue {
  $alert!: typeof Swal;
  @Prop()
  widget!: TabWidget;

  @Prop()
  isShowEdit?: boolean;

  @Prop({ type: Boolean, default: true })
  isShowAdd?: boolean;

  @Prop({ type: Boolean, default: true })
  isShowComponent!: boolean;

  @Ref()
  renameModal!: DiRenameModal;

  @Ref()
  gridstacks!: DiGridstack[];

  // Provide from DiGridstackItem
  @Inject({ default: undefined })
  private readonly remove?: (fn: Function) => void;

  private tabIndex = 0;

  mounted() {
    this.registerEvents();
  }

  handleResize(id: WidgetId): void {
    if (this.widget.id === id) {
      this.emitResizeEvent();
    }
  }

  registerEvents(): void {
    this.$root.$on(DashboardEvents.ResizeWidget, this.handleResize);
  }

  beforeDestroy() {
    this.unregisterEvents();
  }

  unregisterEvents(): void {
    this.$root.$off(DashboardEvents.ResizeWidget, this.handleResize);
  }

  @Watch('tabIndex')
  onTabChanged() {
    this.emitResizeEvent();
  }

  private emitResizeEvent() {
    this.currentWidgetIds.forEach(id => {
      this.$nextTick(() => {
        this.$root.$emit(DashboardEvents.ResizeWidget, id);
      });
    });
  }

  private get currentTab(): Tab | undefined {
    return isNumber(this.tabIndex) ? this.widget.tabItems[this.tabIndex] : void 0;
  }

  private get currentWidgetIds(): WidgetId[] {
    return this.currentTab ? this.currentTab.widgetIds : [];
  }

  private get positions(): DIMap<Position> {
    const positions: DIMap<Position> = {};
    this.currentWidgetIds.forEach(id => {
      if (DashboardModule.positions[id]) {
        positions[id] = DashboardModule.positions[id];
      }
    });
    return positions;
  }

  private get defaultOptions(): CustomGridStackOptions {
    return {
      animate: true,
      column: 48,
      margin: '0.5rem',
      marginUnit: 'rem',
      cellHeight: '32px',
      oneColumnModeDomSort: false,
      disableOneColumnMode: true,
      enableOverlap: false, //temp
      draggable: {
        scroll: true
      },
      resizable: {
        handles: 'e, se, s, sw, w'
      },
      float: false, //temp
      alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
  }

  private clickSelectTab(mouseEvent: MouseEvent) {
    PopupUtils.hideAllPopup();
    const buttonConfigWidget = GenIdMethods.genBtnId(`select-tab-${this.widget.id}`);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(mouseEvent, buttonConfigWidget, 0, 0);
    this.$root.$emit(DashboardEvents.ShowContextMenu, mouseEvent, this.tabSelectOptions());
  }

  private clickConfigWidget(mouseEvent: MouseEvent) {
    PopupUtils.hideAllPopup();
    const buttonConfigWidget = GenIdMethods.genBtnId(`config-widget-${this.widget.id}`);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(mouseEvent, buttonConfigWidget, 0, 0);
    this.$root.$emit(DashboardEvents.ShowContextMenu, mouseEvent, this.widgetConfigOptions);
  }

  private clickConfigTab(mouseEvent: MouseEvent, tabIndex: number) {
    PopupUtils.hideAllPopup();
    const buttonConfigWidget = GenIdMethods.genBtnId(`config-tab-${this.widget.id}-${tabIndex}`);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(mouseEvent, buttonConfigWidget);
    this.$root.$emit(DashboardEvents.ShowContextMenu, buttonEvent, this.tabConfigOptions(tabIndex));
  }

  private async handleAddTab() {
    PopupUtils.hideAllPopup();
    const name = 'New tab';
    const widget = cloneDeep(this.widget).addTab(name);
    await WidgetModule.handleUpdateWidget(widget);
    WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
  }

  private async handleSortTab() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.SortTab, this.widget);
  }

  private async handleDeleteChart(tabIndex: number) {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.RemoveChartFromTab, this.widget, tabIndex, (widgetIds: WidgetId[]) => {
      widgetIds.forEach(id => {
        const gridstack = ListUtils.getHead(this.gridstacks);
        if (gridstack) {
          gridstack.removeItemById(id);
        }
      });
    });
  }

  private async handleAddChartToTab(tabIndex: number) {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.AddChartToTab, this.widget, tabIndex);
  }

  private async handleDeleteTab(index: number) {
    PopupUtils.hideAllPopup();
    const widget = cloneDeep(this.widget).removeTab(index);
    await WidgetModule.handleUpdateWidget(widget);
    WidgetModule.setWidget({ widgetId: widget.id, widget: widget });
  }

  private handleConfigTab() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.UpdateTab, this.widget);
  }

  private async handleDeleteWidget() {
    PopupUtils.hideAllPopup();
    const { isConfirmed } = await this.$alert.fire({
      icon: 'warning',
      title: 'Remove widget',
      html: `Are you sure that you want to remove this widget?`,
      confirmButtonText: 'Yes',
      showCancelButton: true,
      cancelButtonText: 'No'
    });
    if (this.remove && isConfirmed) {
      this.remove(() => {
        WidgetModule.handleDeleteWidget(this.widget).catch(ex => {
          PopupUtils.showError('Can not remove widget, refresh page and try again');
        });
      });
    }
  }

  private get widgetConfigOptions(): ContextMenuItem[] {
    return [
      {
        text: 'Add tab',
        click: this.handleAddTab
      },
      {
        text: 'Sort orders',
        click: this.handleSortTab,
        disabled: this.widget.tabItems.length === 0
      },
      {
        text: 'Config tab',
        click: this.handleConfigTab
      },
      {
        text: 'Delete widget',
        click: this.handleDeleteWidget
      }
    ];
  }

  private tabSelectOptions(): ContextMenuItem[] {
    return this.widget.tabItems.map((tab, index) => {
      return {
        id: `${index}-${tab}`,
        text: tab.name,
        click: () => this.selectTab(index)
      };
    });
  }

  private selectTab(index: number) {
    PopupUtils.hideAllPopup();
    this.tabIndex = index;
  }

  private tabConfigOptions(tabIndex: number): ContextMenuItem[] {
    return [
      {
        text: 'Edit title',
        click: () => this.openRenameModal(this.widget.tabItems[tabIndex].name, tabIndex)
      },
      {
        text: 'Add chart',
        click: () => this.handleAddChartToTab(tabIndex)
      },
      {
        text: 'Remove chart',
        click: () => this.handleDeleteChart(tabIndex)
      },
      {
        text: 'Delete tab',
        click: () => this.handleDeleteTab(tabIndex)
      }
    ];
  }

  private openRenameModal(name: string, extraData: any) {
    PopupUtils.hideAllPopup();
    this.renameModal.show(name, extraData);
  }

  private handleChangePosition(payload: { id: number; position: Position }) {
    if (this.isShowEdit) {
      const { position, id } = payload;
      this.$emit('onChangePosition', payload);
    }
  }

  private get getCurrentCursor(): string {
    return this.isShowEdit ? 'move' : 'default';
  }

  private getWidget(id: number): Widget {
    return DashboardModule.widgetAsMap[id];
  }

  //custom header title
  private get headerStyle() {
    return {
      'font-family': this.widget.extraData?.header?.fontFamily,
      color: this.widget.extraData?.header?.color,
      'font-size': this.widget.extraData?.header?.fontSize
    };
  }

  ///register color
  private get tabStyle() {
    return {
      '--tab-active-background-color': this.widget.extraData?.header?.active?.background,
      '--tab-inactive-background-color': this.widget.extraData?.header?.inActive?.background,
      overflow: 'auto'
    };
  }

  private get isVerticalTab() {
    return this.widget.extraData?.header?.position === 'vertical';
  }

  private get navClass(): string[] {
    return [this.isVerticalTab ? 'vertical' : '', 'nav-bar'];
  }

  private get containerClass(): string[] {
    return [this.isVerticalTab ? 'vertical' : ''];
  }

  private handleRenameTab(newName: string, tabIndex: number) {
    this.renameModal.hide();
    this.widget.tabItems[tabIndex].name = newName;
    return WidgetModule.handleUpdateWidget(this.widget);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

$border-radius: 4px;
.tab-viewer-container {
  height: 100%;
  width: 100%;
  color: var(--secondary-text-color);

  .text-info {
    @include regular-text;
    font-size: 16px;
    letter-spacing: 0.27px;
    line-height: 1.5;
    text-align: center;
    color: var(--text-color) !important;
  }

  b {
    @include bold-text;
    color: $accentColor;
    text-decoration: underline;
    cursor: pointer;
  }

  .card {
    background: transparent;
    border: unset;
    height: 100%;
    width: 100%;

    .tabs {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;

      .grid-item-container {
        height: 100%;
        width: 100%;
        border-style: solid;
        border-radius: 4px;
        border-color: var(--tab-border-color, #f0f0f0);
      }

      .nav-tabs {
        flex-wrap: nowrap;
        white-space: nowrap;
        max-width: 100%;
        margin-right: auto;
        overflow: auto;
      }

      .vertical {
        height: 100%;

        .nav-tabs {
          .tab-end-container {
            flex-direction: row;
            bottom: 0;
            top: unset;
            right: unset;
            text-align: center;
            justify-content: space-between;

            .icon-config-widget {
              width: 100%;
            }
          }

          .nav-item {
            margin-right: 0;
            margin-bottom: 1px;

            .nav-link {
              border-radius: $border-radius 0 0 $border-radius;
            }
          }

          .nav-item:last-child {
            margin-right: 0;
            margin-bottom: 0;
          }
        }
      }

      .nav-bar {
        padding: 0;
        background-color: transparent;
        border: unset;

        .card-header {
          padding: 0;
          background-color: transparent;
        }

        .nav-link {
          border: unset;
          padding: 6px 12px;
          background: var(--tab-inactive-background-color);
        }

        .nav-item {
          margin-right: 1px;
          margin-bottom: 0;
          border-radius: $border-radius $border-radius 0 0;
        }

        .nav-item:last-child {
          margin-right: 0;
          margin-bottom: 0;
        }

        .active-tab-class {
          background: var(--tab-active-background-color);
        }

        .hidden-config-tab {
          display: none;
        }

        .tab-header-title {
          div {
            max-width: 200px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: auto;
          }
        }

        .icon-config-tab {
          margin-left: 8px;
          font-size: 100%;
          color: var(--secondary-text-color);

          &:hover {
            color: var(--header-color);
            background-color: var(--hover-color);
            border-radius: 50%;
          }
        }

        .tab-end-container {
          position: sticky;
          top: 0;
          right: 0;
          display: flex;
          flex-direction: row;

          .icon-config-widget {
            margin-right: 0;

            .nav-link {
              height: 100%;

              div {
                i {
                  font-size: 100%;
                  color: var(--secondary-text-color);

                  &:hover {
                    color: var(--header-color);
                    background-color: var(--hover-color);
                    border-radius: 50%;
                  }
                }
              }
            }
          }
        }

        .card-header-tabs {
          margin-left: 0;
          margin-right: 0;
        }
      }

      .tab-content {
        flex: 1;
        height: inherit;
        width: inherit;

        .card-body {
          height: 100%;
          width: 100%;
          padding: 6px;
          background-color: var(--chart-background-color);
          border-bottom-right-radius: 4px;
          border-bottom-left-radius: 4px;

          .grid-stack-container {
            padding-bottom: 32px;
          }
        }
      }
    }
  }

  &.vertical .card .tabs {
    flex-direction: row;
  }
}
</style>
