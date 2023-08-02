<template>
  <header class="layout-header">
    <button v-if="!noSidebar" @click.prevent="toggleSidebar" class="di-btn-shadow btn-shadow sidebar-action" type="button">
      <i class="di-icon-three-dot" data-show="not-open"></i>
      <i class="di-icon-close" data-show="open"></i>
    </button>

    <router-link v-if="route" class="layout-header-title" :to="route">
      <i :class="icon"></i>
      <span>{{ title }}</span>
    </router-link>
    <div v-else class="layout-header-title">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
      <span>{{ title }}</span>
    </div>
    <slot></slot>
  </header>
</template>
<script lang="ts">
import { Component, Vue, Prop, Inject } from 'vue-property-decorator';
import { RawLocation } from 'vue-router';

@Component({
  name: 'LayoutHeader'
})
export default class LayoutHeader extends Vue {
  @Prop({ type: String, default: 'Title' })
  private readonly title!: string;

  @Prop({ type: String, default: 'di-icon-delete' })
  private readonly icon!: string;

  @Prop({ type: Object })
  private readonly route!: RawLocation;

  @Prop({ type: Boolean, default: false })
  private readonly noSidebar!: boolean;

  @Inject('toggleSidebar')
  private readonly toggleSidebar!: Function;
}
</script>
