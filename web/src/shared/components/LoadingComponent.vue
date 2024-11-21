<template>
  <div class="loading-area">
    <slot></slot>
    <div class="loading-icon" v-if="isLoading">
      <DiLoading></DiLoading>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import DiLoading from '@/shared/components/DiLoading.vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({
  components: { DiLoading }
})
export default class LoadingComponent extends Vue {
  @Prop({ required: false, type: Boolean, default: true })
  private readonly isLoading!: boolean;
}
</script>

<style lang="scss">
.loading-area {
  position: relative;
  height: 100%;
  width: 100%;

  > .loading-icon {
    background-color: var(--active-color);
    z-index: 1;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    //> div {
    //
    //}
  }
}
</style>
