<template>
  <div :class="loadingClass">
    <slot v-if="isLoading" name="loading">
      <div class="w-100 h-100 d-flex flex-row align-items-center justify-content-center status-loading">
        <DiLoading></DiLoading>
      </div>
    </slot>
    <slot v-else-if="isError" :error="error" :onRetry="handleRetry" name="error">
      <ErrorWidget :error="error" :hide-retry="hideRetry" @onRetry="handleRetry"></ErrorWidget>
    </slot>
    <slot v-else-if="isUpdating" name="updating">
      <slot></slot>
      <slot name="progress-updating">
        <div class="w-100 h-100 d-flex flex-row align-items-center justify-content-center status-loading update-background">
          <DiLoading></DiLoading>
        </div>
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

  @Prop({ default: () => [Status.Loaded, Status.Error] })
  private readonly renderWhen!: Status[];

  @Prop({ required: false, type: String, default: 'w-100 h-100' })
  private readonly loadingClass!: string;

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
.update-background {
  background-color: var(--hover-color);
  border-radius: 4px;
  left: 0;
  opacity: 0.8;
  position: absolute;
  top: 0;
  //todo: change z-index here
  z-index: 100;
}
</style>
