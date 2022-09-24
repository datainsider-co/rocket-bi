<template>
  <div class="di-right-panel">
    <header>
      <slot name="header"></slot>
    </header>
    <div class="di-divider"></div>
    <div class="di-right-panel--body">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class RightPanel extends Vue {}
</script>

<style lang="scss">
.di-right-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px - 68px);

  > header {
    align-items: center;
    display: flex;
    height: 33px;
    justify-content: space-between;
  }

  > .di-divider {
    background-color: var(--text-color);
    height: 0.5px;
    margin-bottom: 16px;
    margin-top: 8px;
    opacity: 0.2;
  }

  &--body {
    flex: 1;
    background-color: var(--directory-row-bg);
    overflow: hidden;
    border-radius: 4px;
  }
}
</style>
