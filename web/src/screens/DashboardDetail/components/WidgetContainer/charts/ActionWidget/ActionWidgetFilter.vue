<template>
  <div>
    <div :id="id" @click="toggleShowPopover" tabindex="-1" ref="buttonShowPopover" class="position-relative">
      <div class="icon-filter" :class="{ 'active-filter': settingItem.value }">
        <template v-if="isApplyFilter">
          <i class="di-icon-filter-small icon-title di-popup cursor-pointer"></i>
        </template>
        <template v-else>
          <i class="di-icon-disable-filter icon-title di-popup cursor-pointer"></i>
        </template>
      </div>
    </div>
    <b-popover :show.sync="enablePopover" :target="id" placement="bottom" triggers="click blur" custom-class="db-listing-searchable">
      <div class="title-filter-menu">All filters are applied</div>
      <div class="divider"></div>
      <FilterListingItem v-for="(item, index) in filterRequests" :key="`filter_${index}`" :filter-request="item" />
      <div class="divider"></div>
      <div class="footer-filter-menu">
        <ToggleSettingComponent class="filter-control" :settingItem="settingItem" @onChanged="handleEffectFilterChanged" />
      </div>
    </b-popover>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { FilterRequest } from '@core/domain/Request';
import FilterListingItem from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/FilterItem.vue';
import ToggleSettingComponent from '@/shared/components/builder/setting/ToggleSettingComponent.vue';
import { SettingItem } from '@/shared/models';
import { SettingItemType } from '@/shared';
import { Log } from '@core/utils';

@Component({
  components: { FilterListingItem, ToggleSettingComponent }
})
export default class ActionWidgetFilter extends Vue {
  private enablePopover = false;

  private settingItem: SettingItem;

  @Prop({ required: true, type: String })
  private id!: string;

  @Prop({ required: true, type: Boolean, default: true })
  private isApplyFilter!: boolean;

  @Ref()
  private readonly buttonShowPopover?: HTMLElement;

  constructor() {
    super();
    this.settingItem = new SettingItem('ignore_filter', 'On/Off all filter', this.isApplyFilter, SettingItemType.toggle, '', []);
  }

  @Watch('isApplyFilter')
  onApplyFilterChanged(newValue: boolean) {
    this.settingItem = new SettingItem('ignore_filter', 'On/Off all filter', newValue, SettingItemType.toggle, '', []);
  }

  // Inject from ChartContainer.vue
  @Inject({ default: undefined })
  private onChangeFilterApply?: (enable: boolean) => void;

  private handleEffectFilterChanged(key: string, value: boolean) {
    try {
      this.settingItem.value = value;
      if (this.onChangeFilterApply) {
        this.onChangeFilterApply(value);
      }
    } catch (ex) {
      Log.error('handleEffectFilterChanged::', key, value);
    }
  }

  @Prop({ required: true, type: Array })
  filterRequests!: FilterRequest[];

  private toggleShowPopover() {
    // TODO: Cần gọi method focus để focus vô target button của popover, khi đó trigger blur sẽ hoạt động.
    this.buttonShowPopover?.focus();
    this.enablePopover = !this.enablePopover;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.title-filter-menu {
  @include semi-bold-14();
}

.footer-filter-menu {
  @include regular-text-14();
}

.active-filter::after {
  content: '';
}

.icon-filter::after {
  border-radius: 50%;
  height: 8px;
  width: 8px;
  background-color: var(--accent);
  position: absolute;
  top: 20%;
  right: 8px;
  opacity: 0.8;
}

.icon-filter > i {
  font-size: 40px;
  color: var(--text-color);
}

.icon-filter:hover {
  background-color: var(--hover-color);
}

.divider {
  background-color: rgba(255, 255, 255, 0.1);
  height: 1px;
  margin: 16px 0 16px 0;
}

.db-listing-searchable {
  padding: 16px;
  box-sizing: content-box;
  background-color: var(--menu-background-color);
  border: var(--menu-border);
  box-shadow: var(--menu-shadow);
  border-radius: 4px;
  width: 256px;
  max-width: unset;
  z-index: 10001;
  ::v-deep {
    .arrow {
      display: none;
    }

    .popover-body {
      padding: 0 !important;
    }

    .filter-item {
      margin-bottom: 16px;
    }
  }
}
</style>
