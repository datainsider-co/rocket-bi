<template>
  <VueContext ref="menu" :close-on-click="false" :close-on-scroll="false" class="dashboard-context-menu" tag="div" @close="onContextClose">
    <div v-if="listingHandler" class="dashboard-listing">
      <LazyListing :listing-handler="listingHandler" label-prop="name" value-prop="id" @onClick="handleClickItem"></LazyListing>
    </div>
  </VueContext>
</template>

<script lang="ts">
import { Component, Ref } from 'vue-property-decorator';
import VueContext from 'vue-context';
import LazyListing from '@/screens/dashboard-detail/components/drill-through/LazyListing.vue';
import { DashboardId, Field } from '@core/common/domain';
import { isFunction } from 'lodash';
import SearchInput from '@/shared/components/SearchInput.vue';
import { AutoHideContextMenu } from '@/screens/dashboard-detail/components/AutoHideContextMenu';
import { ListingDrillThroughDashboardHandler } from '@/screens/dashboard-detail/components/drill-through/ListingDrillThroughDashboardHandler';

interface DashboardListingContextMenuData {
  event: MouseEvent;
  currentDashboardId: DashboardId;
  currentFields: Field[];
  onDashboardSelected: (id: DashboardId) => void;
}

@Component({
  components: {
    SearchInput,
    LazyListing,
    VueContext
  }
})
export default class DashboardListingContextMenu extends AutoHideContextMenu {
  @Ref()
  private readonly menu?: VueContext;
  private listingHandler: ListingDrillThroughDashboardHandler | null = null;

  private onDashboardSelected: ((id: DashboardId) => void) | null = null;

  show(data: DashboardListingContextMenuData) {
    const { currentDashboardId, onDashboardSelected, currentFields, event } = data;
    this.onDashboardSelected = onDashboardSelected;
    this.listingHandler = new ListingDrillThroughDashboardHandler([currentDashboardId], currentFields);
    this.menu?.open(event, {});
    this.listenScroll();
  }

  hide() {
    this.menu?.close();
  }

  beforeDestroy() {
    this.removeListenScroll();
  }

  private onContextClose() {
    this.removeListenScroll();
    this.listingHandler = null;
  }

  private handleClickItem(dashboardId: DashboardId): void {
    this.hide();
    if (isFunction(this.onDashboardSelected)) {
      this.onDashboardSelected(dashboardId);
    }
  }
}
</script>

<style lang="scss">
div.v-context.dashboard-context-menu {
  max-height: 360px;
  min-height: 160px;

  padding: 8px 0;
  //max-width: 220px;
  width: 220px;
  //overflow: hidden;
  //padding: 0;

  .dashboard-listing {
    display: flex;
    flex-direction: column;
    margin: 0 8px;
    max-height: 320px;
    position: relative;

    .lazy-loaded .__vuescroll {
      height: 280px !important;
      max-height: 280px;

      .__view {
        width: unset !important;
      }
    }

    .lazy-listing {
      //margin-top: 8px;
      min-height: 160px;
      position: relative;

      // fixme: check css
      //> .status-loading {
      //  position: absolute;
      //}
    }
  }
}
</style>
