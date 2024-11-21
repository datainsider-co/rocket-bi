<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import { LayoutContent } from '@/shared/components/layout-wrapper';
import SSOHeader from '@/screens/organization-settings/views/sso-config/component/SSOHeader.vue';
import SSOBody from '@/screens/organization-settings/views/sso-config/component/SSOBody.vue';

@Component({
  components: { SSOBody, SSOHeader, LayoutContent }
})
export default class SSOConfig extends Vue {
  //
}
</script>

<template>
  <LayoutContent>
    <SSOHeader />
    <SSOBody />
  </LayoutContent>
</template>

<style lang="scss"></style>
