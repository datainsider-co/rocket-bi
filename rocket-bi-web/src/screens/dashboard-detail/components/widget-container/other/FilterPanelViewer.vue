<template>
  <div class="group-filter-viewer-container" :style="tabStyle" :class="containerClass">
    <b-card no-body style="overflow: hidden">
      <b-tabs lazy card no-fade :nav-wrapper-class="navClass" active-nav-item-class="active-tab-class" :vertical="isVerticalTab">
        <!-- Render Tabs Title -->
        <b-tab v-for="(tab, index) in widget.tabItems" :key="'tab-' + index">
          <template #title>
            <div class="d-flex align-items-center tab-header-title" :style="headerStyle">
              <div class="d-flex align-items-center">
                <i class="di-icon-filter-panel mr-2" :style="headerStyle"></i>
                <div>{{ tab.name }}</div>
              </div>
              <transition name="fade">
                <b-nav-item
                  v-if="!isPreview && isShowEdit"
                  @click.stop="clickConfigWidget"
                  href="#"
                  class="icon-config-widget btn-ghost"
                  :id="genBtnId(`config-widget-${widget.id}`)"
                >
                  <div :style="headerStyle">
                    <i class="di-icon-setting icon-title regular-icon-16 cursor-pointer" />
                  </div>
                </b-nav-item>
              </transition>
            </div>
          </template>
          <template v-if="isShowComponent">
            <!-- Empty -->
            <template v-if="currentWidgetIds.length === 0">
              <div class="text-info h-100 w-100 d-flex flex-column align-items-center justify-content-center">
                Your panel is empty<br />
                <div><b href="#" @click="handleAddFilter">Click here</b> to add</div>
              </div>
            </template>
            <!-- Content -->
            <vuescroll v-else class="group-filter-content">
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
                      <WidgetHolder :isShowEdit="isShowEdit" :widget-setting="widgetSetting" :widget="getWidget(id)" :id="`${id}-chart-holder`" />
                    </div>
                  </DiGridstackItem>
                </template>
              </DiGridstack>
            </vuescroll>
          </template>
        </b-tab>
      </b-tabs>
    </b-card>
    <b-card-footer class="group-filter-footer" :style="footerStyle">
      <DiButton
        :is-disable="widget.allWidgets.length === 0 && !isPreview"
        :title="widget.extraData.footer.apply.title"
        primary
        @click="handleApply"
        :isLoading="isLoading"
      />
    </b-card-footer>
    <DiRenameModal ref="renameModal" />
  </div>
</template>

<script lang="ts">
import SortModal from '@/screens/dashboard-detail/components/SortModal.vue';
import WidgetHolder from '@/screens/dashboard-detail/components/widget-container/WidgetHolder.vue';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { DashboardControllerModule, DashboardModule, FilterModule, GroupFilterInfo, WidgetModule } from '@/screens/dashboard-detail/stores';
import { ContextMenuItem } from '@/shared';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { CustomGridStackOptions } from '@/shared/components/gridstack/CustomGridstack';
import DiGridstack from '@/shared/components/gridstack/DiGridstack.vue';
import DiGridstackItem from '@/shared/components/gridstack/DiGridstackItem.vue';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { GenIdMethods } from '@/utils/IdGenerator';
import { PopupUtils } from '@/utils/PopupUtils';
import { DIMap, Position, Tab, Widget, WidgetId, WidgetSetting } from '@core/common/domain';
import { isNumber } from 'lodash';
import { Component, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import Swal from 'sweetalert2';
import { ListUtils, TimeoutUtils } from '@/utils';
import { GroupFilter } from '@core/common/domain/model/widget/normal/GroupFilter';
import DiButton from '@/shared/components/common/DiButton.vue';
import { Log } from '@core/utils';

@Component({ components: { DiButton, WidgetHolder, DiGridstack, DiGridstackItem, DiRenameModal, SortModal } })
export default class FilterPanelViewer extends Vue {
  private static readonly TAB_INDEX = 0;
  protected isLoading = false;
  $alert!: typeof Swal;
  @Prop({ required: true, type: Object })
  readonly widget!: GroupFilter;

  @Prop({ required: false, type: Boolean, default: false })
  readonly isShowEdit?: boolean;

  @Prop({ type: Boolean, default: false })
  readonly isPreview?: boolean;

  @Prop({ type: Boolean, default: true })
  readonly isShowComponent!: boolean;

  @Prop({ required: false, type: Object, default: () => WidgetSetting.default() })
  readonly widgetSetting!: WidgetSetting;

  @Ref()
  readonly renameModal!: DiRenameModal;

  @Ref()
  readonly gridstacks!: DiGridstack[];

  // Provide from DiGridstackItem
  @Inject({ default: undefined })
  private readonly remove?: (fn: Function) => void;

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
    return isNumber(FilterPanelViewer.TAB_INDEX) ? this.widget.tabItems[FilterPanelViewer.TAB_INDEX] : void 0;
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

  private clickConfigWidget(mouseEvent: MouseEvent) {
    PopupUtils.hideAllPopup();
    const buttonConfigWidget = GenIdMethods.genBtnId(`config-widget-${this.widget.id}`);
    const buttonEvent = HtmlElementRenderUtils.fixMenuOverlap(mouseEvent, buttonConfigWidget, 0, 0);
    this.$root.$emit(DashboardEvents.ShowContextMenu, buttonEvent, this.widgetConfigOptions);
  }

  private async handleAddFilter() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.AddFilterToGroup, this.widget, FilterPanelViewer.TAB_INDEX);
  }

  private async handleDeleteFilter() {
    PopupUtils.hideAllPopup();
    const deleteTabWhenEmpty = false;
    this.$root.$emit(
      DashboardEvents.RemoveChartFromTab,
      this.widget,
      FilterPanelViewer.TAB_INDEX,
      this.removeWidgetInGridStack,
      deleteTabWhenEmpty,
      this.removeContent
    );
  }

  private get removeContent(): {
    emptyText: string;
    actionName: string;
    title: string;
    subTitle: string;
  } {
    return {
      emptyText: 'No filters have been removed from this panel',
      actionName: 'Remove',
      title: 'Remove Filter',
      subTitle: 'Remove filter from this panel'
    };
  }

  private removeWidgetInGridStack(ids: WidgetId[]) {
    ids.forEach(id => {
      const gridstack = ListUtils.getHead(this.gridstacks);
      if (gridstack) {
        gridstack.removeItemById(id);
      }
    });
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
      this.remove(async () => {
        try {
          await WidgetModule.handleDeleteWidget(this.widget);
          await this.handleApply();
          FilterModule.removeGroupFilter(this.widget.id);
        } catch (ex) {
          Log.error('handleDeleteWidget', ex);
          PopupUtils.showError('Can not remove widget, refresh page and try again');
        }
      });
    }
  }

  private get widgetConfigOptions(): ContextMenuItem[] {
    return [
      {
        text: 'Edit title',
        click: () => this.openRenameModal(this.widget.tabItems[FilterPanelViewer.TAB_INDEX].name, FilterPanelViewer.TAB_INDEX),
        icon: 'di-icon-under-text'
      },
      {
        text: 'Add filter',
        click: this.handleAddFilter,
        icon: 'di-icon-add'
      },
      {
        text: 'Remove filter',
        click: this.handleDeleteFilter,
        icon: 'di-icon-delete'
      },
      {
        text: 'Config widget',
        click: this.handleConfigTab,
        icon: 'di-icon-setting'
      },
      {
        text: 'Delete widget',
        click: this.handleDeleteWidget,
        icon: 'di-icon-delete'
      }
    ];
  }

  private openRenameModal(name: string, tabIndex: number) {
    PopupUtils.hideAllPopup();
    this.renameModal.show(name, (newName: string) => {
      this.handleRenameTab(newName, tabIndex);
    });
  }

  private handleChangePosition(payload: { id: number; position: Position }) {
    if (this.isShowEdit) {
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
      overflow: 'auto'
    };
  }

  ///register color

  private get footerStyle() {
    return {
      justifyContent: this.widget.extraData?.footer?.align ?? 'right',
      '--apply-color': this.widget.extraData?.footer?.apply?.color,
      '--apply-font': this.widget.extraData?.footer?.apply?.fontFamily,
      '--apply-font-size': this.widget.extraData?.footer?.apply?.fontSize,
      '--apply-background': this.widget.extraData?.footer?.apply?.background
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

  private async handleApply(): Promise<void> {
    if (!this.isPreview) {
      try {
        this.isLoading = true;
        const groupId = this.widget.id;
        if (FilterModule.groupFilterMap.has(groupId)) {
          const groupFilter: GroupFilterInfo = FilterModule.groupFilterMap.get(groupId)!;
          const affectedByFilterIds = this.applyFilter(groupFilter);
          const affectedByCrossFilterIds = await this.applyCrossFilter(groupFilter);
          const affectedIds = ListUtils.distinct([...affectedByFilterIds, ...affectedByCrossFilterIds]);
          // avoid stuck ui
          await TimeoutUtils.sleep(100);
          await DashboardControllerModule.renderCharts({
            idList: affectedIds,
            useBoost: DashboardModule.isUseBoost
          });
        }
      } catch (ex) {
        Log.error('handleApply', ex);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // todo: force apply filter is empty
  private applyFilter(groupFilter: GroupFilterInfo): WidgetId[] {
    // FilterModule.removeFilterRequests(groupFilter.getRemovedFilterIds());
    // FilterModule.addFilterRequests(groupFilter.getRequests());
    // return WidgetModule.allQueryWidgets.filter(widget => FilterModule.canApplyFilter(widget.id)).map(widget => widget.id);
    return [];
  }

  private async applyCrossFilter(groupFilter: GroupFilterInfo): Promise<WidgetId[]> {
    const affectedIds: WidgetId[] = [];
    for (const [filterId, filterValue] of groupFilter.crossFilterValueMap) {
      const widgetIds: WidgetId[] = await DashboardControllerModule.applyDynamicValues({
        id: filterId,
        valueMap: filterValue,
        ignoreReRender: true
      });
      affectedIds.push(...widgetIds);
    }
    return ListUtils.distinct(affectedIds);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables.scss';

$border-radius: 4px;
.group-filter-viewer-container {
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
    height: calc(100% - 50px);
    width: 100%;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;

    .tabs {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;

      .grid-item-container {
        height: 100%;
        width: 100%;
        //border-radius: 4px;
        //border: 1px solid var(--tab-border-color, #f0f0f0) !important;

        .tab-filter-container {
          border-radius: 4px;
          padding: 4px 8px;
        }

        > div {
          border-radius: 4px;
        }
      }

      .nav-tabs {
        flex-wrap: nowrap;
        white-space: nowrap;
        max-width: 100%;
        margin-right: auto;
        overflow: auto;
      }

      .nav-bar {
        padding: 0;
        background-color: transparent;
        border: unset;
        text-align: start;

        .card-header {
          padding: 0;
          background-color: transparent;
        }

        .nav-link {
          border: unset;
          padding: 12px 12px 1px 12px;
          background: var(--tab-inactive-background-color);
        }

        .nav-item {
          width: 100%;
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
          i:before {
            font-size: inherit;
            color: inherit;
          }

          div {
            width: 100%;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: auto;
          }

          .icon-config-widget {
            position: absolute;
            right: 0;
            width: unset;

            i {
              font-size: 14px;
            }

            .nav-link {
              padding: 9px;
              background-color: unset;
            }
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
          background-color: var(--tab-active-background-color);

          .grid-stack-container {
            padding-bottom: 32px;
          }
        }
      }
    }
  }

  .group-filter-footer {
    height: 50px;
    display: flex;
    flex-direction: initial;
    background-color: var(--tab-active-background-color);
    padding: 12px;
    border: unset;

    .di-button {
      padding-left: 20px;
      padding-right: 20px;
      background-color: var(--apply-background) !important;
      color: var(--apply-color) !important;
      font-size: var(--apply-font-size) !important;
      font-family: var(--apply-font) !important;

      .btn-primary {
      }
    }
  }
}
</style>
