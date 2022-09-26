<template>
  <div class="layout-wrapper" :class="{ open: showedSidebar, 'no-sidebar': noSidebar }">
    <HeaderBar></HeaderBar>
    <div class="layout-wrapper--body">
      <div v-if="!noSidebar" @click.prevent="toggleSidebar(false)" class="layout-wrapper--backdrop"></div>
      <slot></slot>
    </div>
  </div>
</template>
<style lang="scss" src="./LayoutWrapper.style.scss"></style>
<script lang="ts">
import { Component, Vue, Provide, Prop } from 'vue-property-decorator';

@Component({
  name: 'LayoutWrapper'
})
export default class LayoutWrapper extends Vue {
  @Prop({ type: Boolean, default: false })
  private readonly noSidebar!: boolean;

  private showedSidebar = false;
  @Provide('toggleSidebar')
  toggleSidebar(isShowed?: boolean) {
    if (typeof isShowed === 'boolean') {
      this.showedSidebar = isShowed;
    } else {
      this.showedSidebar = !this.showedSidebar;
    }
  }
}
</script>
