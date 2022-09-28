<template>
  <div class="d-flex justify-content-center align-items-center rounded h-100 empty-widget">
    <div class="d-flex flex-column justify-content-center align-items-center">
      <slot name="icon">
        <EmptyDataIcon />
      </slot>
      <div class="empty-text text-center">
        <slot name="default"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class EmptyWidget extends Vue {}
</script>
<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.text-info {
  @include regular-text;
  font-size: 12px;
  letter-spacing: 0.2px;
  text-align: center;
  color: var(--text-color) !important;
  opacity: 0.8;
}
.text-body {
  @include regular-text;
  font-size: 12px;
  letter-spacing: 0.2px;
  text-align: center;
  opacity: 0.6;
  color: var(--text-color) !important;
  margin-top: 8px;
}

.empty-text {
  font-size: 16px;
}
</style>
