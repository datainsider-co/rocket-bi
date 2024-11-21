<template>
  <div class="flex-grow-1">
    <TitleTab />
    <BackgroundTab />
    <VisualHeader />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import TitleTab from '@/shared/settings/common/tabs/TitleTab.vue';
import BackgroundTab from '@/shared/settings/common/tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/settings/common/tabs/VisualHeader.vue';

@Component({ components: { TitleTab, BackgroundTab, VisualHeader } })
export default class DefaultSetting extends Vue {
  //
}
</script>
