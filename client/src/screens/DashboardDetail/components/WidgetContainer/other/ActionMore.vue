<template>
  <div class="btn-icon-40 btn-ghost">
    <div
      class="h-100 d-flex justify-content-center align-items-center"
      :id="genBtnId('action-more', id)"
      ref="btnMenuRef"
      v-b-tooltip.d500.top="'More'"
      tabindex="-1"
      title="More"
      @click="toggleMenu"
    >
      <div class="d-table-cell align-middle text-center">
        <i class="di-icon-setting"></i>
      </div>
    </div>
    <b-popover custom-class="none-action-container" :show.sync="isShowMenu" :target="genBtnId('action-more', id)" placement="BottomLeft" triggers="click blur">
      <div class="action-more regular-icon-16 text-left">
        <template v-for="(item, index) in menuOptions">
          <DiButton
            :id="genBtnId(`action-${item.text}`, index)"
            :key="genBtnId(`action-${item.text}`, index)"
            :is-disable="item.disabled"
            :title="item.text"
            @click="onClickItem(item)"
          >
            <img v-if="hasIcon(item.icon)" :src="require(`@/assets/icon/${item.icon}`)" alt="" />
          </DiButton>
        </template>
      </div>
    </b-popover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ContextMenuItem, DashboardOptions } from '@/shared';
import { DashboardModeModule } from '@/screens/DashboardDetail/stores';
import { TimeoutUtils } from '@/utils';
import { PopupUtils } from '@/utils/popup.utils';

@Component({ components: {} })
export default class ActionMore extends Vue {
  @Prop({ required: true, type: String })
  private id!: string;

  @Ref()
  private readonly btnMenuRef?: HTMLElement;

  private isShowMenu = false;

  private toggleMenu() {
    this.btnMenuRef?.focus();
    this.isShowMenu = !this.isShowMenu;
  }

  private get menuOptions(): ContextMenuItem[] {
    return [
      {
        text: DashboardOptions.EDIT_TITLE,
        click: this.handleEditTitle,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.CONFIG_CHART,
        click: this.handleEditChart,
        disabled: !DashboardModeModule.canEdit
      },
      {
        text: DashboardOptions.DUPLICATE_CHART,
        click: this.duplicateChart,
        disabled: !DashboardModeModule.canDuplicate
      },
      {
        text: DashboardOptions.DELETE,
        click: this.deleteChart,
        disabled: !DashboardModeModule.canDelete
      }
    ];
  }

  private onClickItem(item: ContextMenuItem) {
    this.isShowMenu = false;
    // fix: menu splash
    TimeoutUtils.waitAndExec(null, () => item.click(), 100);
  }

  private hasIcon(icon?: string): boolean {
    return !!icon;
  }

  private handleEditTitle() {
    PopupUtils.hideAllPopup();
    this.$emit('editTitle');
  }

  private handleEditChart() {
    PopupUtils.hideAllPopup();
    this.$emit('editChart');
  }
  private duplicateChart() {
    PopupUtils.hideAllPopup();
    this.$emit('duplicate');
  }

  private deleteChart() {
    PopupUtils.hideAllPopup();
    this.$emit('delete');
  }
}
</script>

<style lang="scss" scoped>
.none-action-container {
  background-color: var(--menu-background-color);
  border: var(--menu-border) !important;
  border-radius: 4px;
  box-shadow: var(--menu-shadow);
  box-sizing: content-box;
  max-width: unset;
  padding: 0;
  text-align: left;
  width: 145px;

  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }
  }
}
.btn-icon-40 {
  height: 40px;
  width: 40px;
}
</style>
