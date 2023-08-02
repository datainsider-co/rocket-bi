<template>
  <div :style="containerStyle" v-b-hover="handleHover" class="overflow-hidden h-100">
    <template v-if="isText">
      <TextViewer :class="[scrollClass, textClass]" class="d-flex flex-row align-items-center h-100 w-100" :widget="widget" :is-edit="showEditComponent" />
    </template>
    <template v-if="isText">
      <template v-if="isShowEdit">
        <div class="d-block edit-header btn-ghost" :class="ignoredClassActionMore" @click.prevent="clickSeeMore">
          <i class="di-icon-setting" :class="ignoredClassActionMore"> </i>
        </div>
      </template>
    </template>
    <template v-else-if="isDynamicFunction">
      <div class="h-100 w-100">
        <DynamicFunctionViewer :widget="widget" :showEditComponent="showEditComponent" />
      </div>
    </template>
    <template v-else-if="isDynamicCondition">
      <div class="h-100 w-100">
        <DynamicConditionViewer :widget="widget" :showEditComponent="showEditComponent" />
      </div>
    </template>
    <template v-else>
      <!--      <transition name="fade">-->
      <template v-if="isShowEdit">
        <div class="d-block edit-header btn-ghost" :class="ignoredClassActionMore" @click.prevent="clickSeeMore">
          <i class="di-icon-setting" :class="ignoredClassActionMore"> </i>
        </div>
      </template>
      <!--      </transition>-->
      <div class="h-100 w-100">
        <ImageViewer v-if="this.isImage" :widget="widget" />
        <div v-else>Widget unsupported</div>
      </div>
      <ImageBrowserModal ref="imageBrowserModal" />
      <UploadImageComponent ref="uploadImageComponent" />
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
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem, DashboardOptions } from '@/shared';
import { Widget, Widgets, TextWidget } from '@core/common/domain/model';
import ImageViewer from '@/screens/dashboard-detail/components/widget-container/other/ImageViewer.vue';
import TextViewer from '@/screens/dashboard-detail/components/widget-container/other/TextViewer.vue';
import { DashboardModeModule, DashboardModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import DynamicFunctionViewer from '@/screens/dashboard-detail/components/widget-container/other/DynamicFunctionViewer.vue';
import DynamicConditionViewer from '@/screens/dashboard-detail/components/widget-container/other/DynamicConditionViewer.vue';
import { CopiedData, CopiedDataType } from '@/screens/dashboard-detail/intefaces/CopiedData';
import UploadImageComponent from '@/screens/dashboard-detail/components/upload/UploadImageComponent.vue';
import ImageBrowserModal from '@/screens/dashboard-detail/components/upload/ImageBrowserModal.vue';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { HtmlElementRenderUtils } from '@/utils';
import ClickOutside from 'vue-click-outside';
import { BPopover } from 'bootstrap-vue';
import ContextMenu from '@/shared/components/ContextMenu.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';

@Component({
  components: { PopoverV2, ImageViewer, TextViewer, DynamicFunctionViewer, DynamicConditionViewer, UploadImageComponent, ImageBrowserModal, ContextMenu },
  directives: {
    ClickOutside
  }
})
export default class OtherWidget extends Vue {
  private popupItem: Element | null = null;
  isHovered = false;
  // isShowActionMoreMenu = false;
  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;
  @Prop({ required: true })
  widget!: Widget;
  // Provide from DiGridstackItem
  @Inject()
  remove!: (fn: Function) => void;

  @Ref()
  private imageBrowserModal?: ImageBrowserModal;

  @Ref()
  private uploadImageComponent?: UploadImageComponent;

  @Ref()
  private actionMorePopover?: PopoverV2;

  get isImage(): boolean {
    return this.widget.className === Widgets.Image;
  }

  private get containerStyle() {
    return { boxShadow: '0px 4px 8px 0px rgba(0, 0, 0, 0.10)', borderRadius: '4px' };
  }

  private get ignoredClassActionMore() {
    return `ignored-class-action-more-${this.widget.id}`;
  }

  get actionMoreButtonId() {
    return `action-more-${this.widget.id}`;
  }

  get isText(): boolean {
    return this.widget.className === Widgets.Text;
  }

  get isDynamicFunction(): boolean {
    return this.widget.className === Widgets.DynamicFunctionWidget;
  }

  get isDynamicCondition(): boolean {
    return this.widget.className === Widgets.DynamicConditionWidget;
  }

  get isShowEdit(): boolean {
    return this.showEditComponent && this.isHovered;
  }

  get textClass(): string {
    return this.showEditComponent ? '' : 'disable';
  }

  get scrollClass(): string {
    return this.showEditComponent ? '' : 'overflow-auto';
  }

  get paddingClass(): string {
    return 'pad-x-15';
  }

  private get normalWidgetActions(): ContextMenuItem[] {
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

  private get textWidgetActions(): ContextMenuItem[] {
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

  handleHover(isHovered: boolean) {
    this.isHovered = isHovered;
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

  private get menuItems() {
    return this.isText ? this.textWidgetActions : this.normalWidgetActions;
  }

  private duplicateWidget() {
    PopupUtils.hideAllPopup();
    WidgetModule.handleDuplicateWidget(this.widget);
  }

  private deleteWidget() {
    this.remove(() => {
      PopupUtils.hideAllPopup();
      WidgetModule.handleDeleteWidget(this.widget);
    });
  }

  private editText() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowEditTextModal, this.widget, true);
  }

  private copyWidget() {
    PopupUtils.hideAllPopup();
    const copiedData = CopiedData.create(CopiedDataType.Widget, {
      widget: this.widget,
      position: WidgetModule.getPosition(this.widget.id)
    });
    DashboardModule.setCopiedData(copiedData);
    this.$copyText(JSON.stringify(copiedData));
  }

  private replaceImage() {
    PopupUtils.hideAllPopup();
    this.$root.$emit(DashboardEvents.ShowImageBrowserModal, cloneDeep(this.widget));
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';

.pad-l-15 {
  padding-left: 15px;
}

.edit-header {
  height: 40px;
  width: 40px;

  border-radius: 4px;
  position: absolute;
  top: 8px;
  right: 0px;
  i {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}
</style>

<style lang="scss">
.other-widget-action-more-menu {
  height: 0;
  .popover-menu {
    z-index: 1000;
  }
}
</style>
