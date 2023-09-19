<template>
  <div class="di-status-widget">
    <slot v-if="isLoading" name="loading">
      <DiLoading class="di-status-widget--loading"></DiLoading>
    </slot>
    <slot v-else-if="isError" :error="error" :onRetry="handleRetry" name="error">
      <ErrorWidget class="di-status-widget--error" :error="error" :hide-retry="hideRetry" @onRetry="handleRetry"></ErrorWidget>
    </slot>
    <slot v-else-if="isUpdating" name="updating">
      <slot></slot>
      <slot name="progress-updating">
        <DiLoading class="di-status-widget--updating"></DiLoading>
      </slot>
    </slot>
    <slot v-else-if="isEmpty" name="empty"></slot>
    <slot v-else></slot>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { Status } from '@/shared';
import ErrorWidget from '@/shared/components/ErrorWidget.vue';
@Component({
  components: { ErrorWidget }
})
export default class StatusWidget extends Vue {
  @Prop({ required: false, default: Status.Loading })
  private readonly status!: Status;

  @Prop({ type: String, default: 'Load chart error!' })
  private readonly error!: string;

  @Prop({ required: false, default: false })
  private readonly hideRetry!: boolean;

  private get isLoading(): boolean {
    return this.status === Status.Loading;
  }

  private get isError(): boolean {
    return this.status === Status.Error;
  }

  private get isEmpty(): boolean {
    return this.status === Status.Empty;
  }

  private get isUpdating(): boolean {
    return this.status === Status.Updating;
  }

  @Emit('retry')
  private handleRetry(event: MouseEvent) {
    return event;
  }
}
</script>

<style lang="scss">
.di-status-widget {
  position: relative;
  height: 100%;
  width: 100%;

  &--loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &--error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &--updating {
    background: var(--hover-color);
    filter: opacity(0.6);
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
}
</style>
