<template>
  <div v-b-hover="handleHover" class="overflow-hidden h-100">
    <template v-if="isText">
      <div :style="{ background: widget.backgroundColor }" :class="[paddingClass, scrollClass]" class="d-flex flex-row align-items-center h-100 w-100">
        <TextViewer :class="textClass" :widget="widget" />
        <template v-if="showEditComponent">
          <b-icon-three-dots-vertical v-show="isShowEdit" class="ml-auto btn-icon btn-ghost di-popup ic-16 mr-1" @click.prevent="clickSeeMore">
          </b-icon-three-dots-vertical>
        </template>
      </div>
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
      <transition name="fade">
        <template v-if="isShowEdit">
          <div class="d-block edit-header">
            <b-icon-three-dots-vertical class="btn-icon float-right btn-ghost di-popup ic-16 image-icon" @click.prevent="clickSeeMore">
            </b-icon-three-dots-vertical>
          </div>
        </template>
      </transition>
      <div class="h-100 w-100">
        <ImageViewer v-if="this.isImage" :widget="widget" />
        <div v-else>Widget unsupported</div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Vue } from 'vue-property-decorator';
import { ContextMenuItem, DashboardOptions } from '@/shared';
import { Widget, Widgets } from '@core/common/domain/model';
import ImageViewer from '@/screens/dashboard-detail/components/widget-container/other/ImageViewer.vue';
import TextViewer from '@/screens/dashboard-detail/components/widget-container/other/TextViewer.vue';
import { DashboardModeModule, WidgetModule } from '@/screens/dashboard-detail/stores';
import { PopupUtils } from '@/utils/PopupUtils';
import { DashboardEvents } from '@/screens/dashboard-detail/enums/DashboardEvents';
import DynamicFunctionViewer from '@/screens/dashboard-detail/components/widget-container/other/DynamicFunctionViewer.vue';
import DynamicConditionViewer from '@/screens/dashboard-detail/components/widget-container/other/DynamicConditionViewer.vue';

@Component({ components: { ImageViewer, TextViewer, DynamicFunctionViewer, DynamicConditionViewer } })
export default class OtherWidget extends Vue {
  isHovered = false;
  @Prop({ type: Boolean, default: false })
  showEditComponent!: boolean;
  @Prop({ required: true })
  widget!: Widget;
  // Provide from DiGridstackItem
  @Inject()
  remove!: (fn: Function) => void;

  get isImage(): boolean {
    return this.widget.className === Widgets.Image;
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
    return this.showEditComponent ? 'disable' : '';
  }

  get scrollClass(): string {
    return this.showEditComponent ? '' : 'overflow-auto';
  }

  get paddingClass(): string {
    if (this.showEditComponent) {
      return 'pad-l-15';
    } else {
      return 'pad-x-15';
    }
  }

  private get normalWidgetActions(): ContextMenuItem[] {
    return [
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
    const meuItems = this.isText ? this.textWidgetActions : this.normalWidgetActions;
    this.$root.$emit(DashboardEvents.ShowContextMenu, event, meuItems);
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
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';

.pad-l-15 {
  padding-left: 15px;
}

.edit-header {
  background-color: $secondaryColor;
  height: 48px;
  justify-content: center;
  opacity: 0.5;
  position: absolute;
  width: 100%;
}

.image-icon {
  color: var(--text-color);
  margin-top: 10px;
  opacity: 1 !important;
}
</style>
