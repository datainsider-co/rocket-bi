<template>
  <div class="d-flex justify-content-center align-items-center fill-blur rounded">
    <div>
      <img class="ic-40" style="margin-bottom: 15px" src="@/assets/icon/ic_empty_dashboard.svg" alt="empty dashboard" />
      <div class="text-info">
        Your dashboard is empty <br />
        <b href="#" @click="handleAddChart">Click here</b> to add your first chart
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { DataManager } from '@core/services';
import { Inject } from 'typescript-ioc';
import { DashboardModeModule } from '@/screens/DashboardDetail/stores/dashboard/DashboardModeStore';
import { ActionType } from '@/utils/permission_utils';
import { PopupUtils } from '@/utils/popup.utils';
import { DashboardModule } from '@/screens/DashboardDetail/stores';
import { DashboardEvents } from '@/screens/DashboardDetail/enums/DashboardEvents';

@Component
export default class EmptyDashboard extends Vue {
  @Inject
  private dataManager!: DataManager;

  private handleAddChart() {
    const dashboard = DashboardModule.currentDashboard;
    if (this.isCreator && dashboard) {
      this.dataManager.saveCurrentDashboardId(dashboard.id.toString());
      this.dataManager.saveCurrentDashboard(dashboard);
      this.$root.$emit(DashboardEvents.AddChart);
      // RouteUtils.navigateToDataBuilder(this.$route, FilterModule.routerFilters);
    } else {
      PopupUtils.showError("You don't have permission to create dashboard.");
    }
  }

  private get isCreator() {
    return DashboardModeModule.actionTypes.has(ActionType.create);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

.fill-blur {
  background-color: $headerColor;
  //box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
}

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
</style>
