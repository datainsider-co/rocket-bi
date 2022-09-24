<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navItems"></LayoutSidebar>
    <router-view class="my-data-listing"></router-view>
  </LayoutWrapper>
</template>

<script lang="ts">
import { Component } from 'vue-property-decorator';
import { NavigationItem } from '@/shared/components/Common/NavigationPanel.vue';
import { Routers } from '@/shared';
import { LoggedInScreen } from '@/shared/components/VueHook/LoggedInScreen';
import { LayoutSidebar, LayoutWrapper } from '@/shared/components/LayoutWrapper';

@Component({
  components: {
    LayoutWrapper,
    LayoutSidebar
  }
})
export default class LakeJobManagement extends LoggedInScreen {
  private get navItems(): NavigationItem[] {
    return [
      {
        id: 'jobs',
        displayName: 'Jobs Management',
        icon: 'di-icon-job',
        to: { name: Routers.LakeAllJob }
      },
      {
        id: 'jobs-history',
        displayName: 'Jobs History',
        icon: 'di-icon-job-history',
        to: { name: Routers.LakeJobHistory }
      }
    ];
  }
}
</script>

<style lang="scss">
.lake-job-management {
  display: flex;
  flex-direction: column;
  height: 100vh;

  &--body {
    display: flex;
    flex: 1;
    padding: 24px 32px 24px 16px;

    #create-job-builder {
      width: fit-content;
      margin-bottom: 16px;
      i {
        margin-right: 12px;
      }
      @media screen and (max-width: 800px) {
        .title {
          display: none;
        }
        i {
          margin: 0;
        }
      }
    }

    > * {
      overflow: hidden;
    }

    > .my-data-listing {
      flex: 1;
    }
  }
}
</style>
