<template functional>
  <div>
    <img class="loading-container" alt="loading" src="@/assets/icon/loading.svg" />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class DiLoading extends Vue {}
</script>
<style lang="scss">
.loading-container {
  animation-name: spin;
  animation-duration: 2000ms;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
