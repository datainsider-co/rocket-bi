<template>
  <div class="layout-sidebar">
    <NavigationPanel :items="items">
      <template v-slot:top>
        <slot name="top"></slot>
      </template>
    </NavigationPanel>
  </div>
</template>
<script lang="ts">
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import NavigationPanel, { NavigationItem } from '@/shared/components/common/NavigationPanel.vue';

@Component({
  components: {
    NavigationPanel
  }
})
export default class LayoutSidebar extends Vue {
  @Prop({ required: true, type: Array, default: [] })
  private readonly items!: NavigationItem[];

  @Inject('toggleSidebar')
  private readonly toggleSidebar!: Function;

  mounted() {
    $(this.$el).on('click', '.navigation-panel--nav-item', () => {
      this.toggleSidebar(false);
    });
  }
}
</script>
