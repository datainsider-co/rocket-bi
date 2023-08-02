<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems"></LayoutSidebar>
    <router-view class="my-data-listing"></router-view>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Routers } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DataIngestionTable from '@/screens/data-ingestion/components/DataIngestionTable.vue';
import SearchInput from '@/shared/components/SearchInput.vue';
import DiShareModal from '@/shared/components/common/di-share-modal/DiShareModal.vue';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/layout-wrapper';

@Component({
  components: {
    DiShareModal,
    SearchInput,
    LayoutWrapper,
    LayoutSidebar
  }
})
export default class DatabaseManagement extends Vue {
  private get navItems(): NavigationItem[] {
    return [
      {
        id: 'database',
        displayName: 'All Database',
        icon: 'di-icon-database',
        to: { name: Routers.AllDatabase }
      },
      {
        id: 'trashDatabase',
        displayName: 'Trash',
        icon: 'di-icon-delete',
        to: { name: Routers.TrashDatabase }
      }
    ];
  }
}
</script>

<style lang="scss">
.database-management {
  display: flex;
  flex-direction: column;
  height: 100%;

  &--body {
    display: flex;
    flex: 1;
    //padding: 24px 32px 24px 16px;

    > * {
      overflow: hidden;
    }

    > .my-data-listing {
      flex: 1;
    }
  }
}
</style>
