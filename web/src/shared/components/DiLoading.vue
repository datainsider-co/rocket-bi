<template>
  <div
    class="di-loading"
    :class="{
      'di-loading--full': mode === 'full'
    }"
  >
    <img class="loading-container" alt="loading" src="@/assets/icon/loading.svg" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DiLoading extends Vue {
  @Prop({ required: false, type: String, default: 'full' })
  protected readonly mode!: 'small' | 'full';
}
</script>
<style lang="scss">
.di-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  &.di-loading--full {
    height: 100%;
    width: 100%;
  }

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
}
</style>
