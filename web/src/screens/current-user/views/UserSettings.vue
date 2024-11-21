<template>
  <LayoutWrapper>
    <LayoutSidebar :items="navigationSettingItems"></LayoutSidebar>
    <router-view />
  </LayoutWrapper>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';
import { Routers } from '@/shared';
import { LayoutWrapper, LayoutSidebar } from '@/shared/components/layout-wrapper';
@Component({
  components: { LayoutWrapper, LayoutSidebar }
})
export default class UserSettings extends Vue {
  private readonly navigationSettingItems: NavigationItem[] = [
    {
      id: Routers.UserProfile,
      displayName: 'Your Profile',
      icon: 'di-icon-user-profile-2',
      to: { name: Routers.UserProfile }
    }
  ];
}
</script>

<style lang="scss">
.current-user-screen {
  display: flex;
  flex: 1;
  &--content {
    padding: 24px 31px 20px 16px;
    display: flex;
    flex: 1;
    height: 100%;
    &--menu {
    }

    &--child {
      display: flex;
      flex: 1;
    }
  }
}
</style>
