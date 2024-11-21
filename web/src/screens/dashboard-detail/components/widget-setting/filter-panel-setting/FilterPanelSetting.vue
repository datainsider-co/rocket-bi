<template>
  <div>
    <FilterPanelHeaderTab :widget.sync="tab" />
    <FilterPanelFooterTab :widget.sync="tab" />
    <FilterPanelBackgroundTab :widget.sync="tab" />
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { TabWidget } from '@core/common/domain';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import FilterPanelHeaderTab from '@/screens/dashboard-detail/components/widget-setting/filter-panel-setting/FilterPanelHeaderTab.vue';
import FilterPanelFooterTab from '@/screens/dashboard-detail/components/widget-setting/filter-panel-setting/FilterPanelFooterTab.vue';
import FilterPanelBackgroundTab from '@/screens/dashboard-detail/components/widget-setting/filter-panel-setting/FilterPanelBackgroundTab.vue';

@Component({ components: { FilterPanelHeaderTab, FilterPanelFooterTab, FilterPanelBackgroundTab } })
export default class FilterPanelSetting extends Vue {
  @PropSync('widget')
  tab!: TabWidget;
}
</script>
