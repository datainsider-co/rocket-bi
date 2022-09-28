<template>
  <div class="flex-grow-1">
    <TitleTab />
    <BackgroundTab />
    <VisualHeader />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import TitleTab from '@/shared/Settings/Common/Tabs/TitleTab.vue';
import BackgroundTab from '@/shared/Settings/Common/Tabs/BackgroundTab.vue';
import VisualHeader from '@/shared/Settings/Common/Tabs/VisualHeader.vue';

@Component({ components: { TitleTab, BackgroundTab, VisualHeader } })
export default class DefaultSetting extends Vue {
  //
}
</script>
