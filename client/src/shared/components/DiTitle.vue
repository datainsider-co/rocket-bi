<template>
  <div class="di-title unselectable">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
@Component({})
export default class DiTitle extends Vue {
  //
}
</script>

<style lang="scss">
.di-title {
  font-size: 24px;
  font-weight: var(--builder-font-weight, 500);
  font-stretch: normal;
  font-style: normal;
  line-height: 1.17;
  letter-spacing: 0.2px;
  color: var(--text-color);
}
</style>
