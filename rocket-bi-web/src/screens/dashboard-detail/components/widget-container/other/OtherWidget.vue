<template>
  <WidgetContainer :widget="widget" :default-setting="widgetSetting" class="di-other-widget">
    <template #default>
      <TextViewer v-if="isText" :class="[scrollClass, textClass]" class="di-other-widget--text" :widget="widget" :is-edit="showEditComponent" />
      <ImageViewer v-else-if="isImage" :widget="widget" />
      <template v-else>
        <div class="h-100 w-100">
          <div>Widget unsupported</div>
        </div>
      </template>
      <PopoverV2
        :ignoredClasses="[ignoredClassActionMore]"
        ref="actionMorePopover"
        placement="bottom-end"
        class="other-widget-action-more-menu dropdown"
        auto-hide
      >
        <template v-slot:menu>
          <div :id="actionMoreButtonId" class="action-more regular-icon-16 text-left">
            <template v-for="(item, index) in menuItems">
              <DiButton
                style="width: 137px"
                :id="genBtnId(`action-${item.text}`, index)"
                :key="genBtnId(`action-${item.text}`, index)"
                :is-disable="item.disabled"
                :title="item.text"
                @click="item.click"
              >
              </DiButton>
            </template>
          </div>
        </template>
      </PopoverV2>
    </template>
    <template #action-bar v-if="isShowEdit">
      <div class="d-block edit-header btn-ghost" :class="ignoredClassActionMore" @click.prevent="clickSeeMore">
        <i class="di-icon-setting" :class="ignoredClassActionMore"> </i>
      </div>
    </template>
  </WidgetContainer>
</template>

<script lang="ts">
import { Component, Inject, Prop, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem, DashboardOptions } from '@/shared';
import { Widget, Widgets, WidgetSetting } from '@core/common/domain/model';
import ImageViewer from '@/screens/dashboard-detail/components/widget-container/other/ImageViewer.vue';
import TextViewer from '@/screens/dashboard-detail/components/widget-container/other/TextViewer.vue';
import { DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import { CopiedData, CopiedDataType } from '@/screens/dashboard-detail/intefaces/CopiedData';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import ClickOutside from 'vue-click-outside';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import WidgetContainer from '@/screens/dashboard-detail/components/widget-container/WidgetContainer.vue';

@Component({
  components: { WidgetContainer, PopoverV2, ImageViewer, TextViewer, ContextMenu },
  directives: {
    ClickOutside
  }
})
export default class OtherWidget extends Vue {
  protected popupItem: Element | null = null;

  @Prop({ type: Boolean, default: false })
  protected readonly showEditComponent!: boolean;
  @Prop({ required: true })
  protected readonly widget!: Widget;

  @Prop({ required: true, type: Object })
  protected readonly widgetSetting!: WidgetSetting;

  // Provide from DiGridstackItem
  @Inject()
  protected readonly remove!: (fn: Function) => void;

  @Ref()
  protected readonly actionMorePopover?: PopoverV2;

  get isImage(): boolean {
    return this.widget.className === Widgets.Image;
  }

  protected get ignoredClassActionMore() {
    return `ignored-class-action-more-${this.widget.id}`;
  }

  get actionMoreButtonId() {
    return `action-more-${this.widget.id}`;
  }

  get isText(): boolean {
    return this.widget.className === Widgets.Text;
  }

  get isShowEdit(): boolean {
    return this.showEditComponent;
  }

  get textClass(): string {
    return this.showEditComponent ? '' : 'disable';
  }

  get scrollClass(): string {
    return this.showEditComponent ? '' : 'overflow-auto';
  }

  protected get normalWidgetActions(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.REPLACE_IMAGE,
        click: this.replaceImage,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.DUPLICATE,
        click: this.duplicateWidget,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteWidget,
        disabled: !DashboardModeModule.canDelete
      }
    ];
  }

  protected get textWidgetActions(): ContextMenuItem[] {
    return [
      {
        text: 'Copy widget',
        click: this.copyWidget,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.EDIT_TEXT,
        click: this.editText,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.DUPLICATE,
        click: this.duplicateWidget,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteWidget,
        disabled: !DashboardModeModule.canDelete
      }
    ];
  }

  clickSeeMore(event: Event) {
    this.popupItem = document.body.querySelector(`#${this.actionMoreButtonId}`);
    Log.debug('OtherWidget::clickSeeMore::', this.popupItem);

    if (this.actionMorePopover) {
      if (this.actionMorePopover.showing) {
        this.actionMorePopover.hidePopover();
      } else {
        document.body.appendChild(this.actionMorePopover?.$el);
        this.actionMorePopover?.showPopover(event.target as HTMLElement);
      }
    }
  }

  protected get menuItems() {
    return this.isText ? this.textWidgetActions : this.normalWidgetActions;
  }

  protected duplicateWidget() {
    PopupUtils.hideAllPopup();
    WidgetModule.handleDuplicateWidget(this.widget);
  }

  protected deleteWidget() {
    this.remove(() => {
      PopupUtils.hideAllPopup();
      WidgetModule.handleDeleteWidget(this.widget);
    });
  }

  protected editText() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowEditTextModal, this.widget, true);
  }

  protected copyWidget() {
    PopupUtils.hideAllPopup();
    const copiedData = CopiedData.create(CopiedDataType.Widget, {
      widget: this.widget,
      position: WidgetModule.getPosition(this.widget.id)
    });
    DashboardModule.setCopiedData(copiedData);
    this.$copyText(JSON.stringify(copiedData));
  }

  protected replaceImage() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowImageBrowserModal, cloneDeep(this.widget));
  }
}
</script>

<style lang="scss">
.di-other-widget {
  .edit-header {
    height: 40px;
    width: 40px;

    border-radius: 4px;
    i {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }
  }

  .other-widget-action-more-menu {
    height: 0;
    .popover-menu {
      z-index: 1000;
    }
  }
}
</style>
