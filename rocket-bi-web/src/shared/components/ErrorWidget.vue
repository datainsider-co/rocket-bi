<template>
  <div class="chart-error h-100 d-flex flex-column align-items-center justify-content-center">
    <i class="di-icon-warning unselectable chart-error-icon"></i>
    <h6>{{ error }}</h6>
    <div v-if="!hideRetry" class="btn btn-primary" @click="retry">Try Again</div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class ErrorWidget extends Vue {
  @Prop({ required: true, type: String })
  private readonly error!: string;

  @Prop({ required: false, default: false })
  private readonly hideRetry!: boolean;

  @Emit('onRetry')
  private retry(event: MouseEvent): MouseEvent {
    return event;
  }
}
</script>

<style lang="scss" scoped>
.chart-error {
  padding: 15px;
  overflow: auto;

  h6 + div {
    margin-top: 24px;
  }

  h6 {
    -webkit-box-orient: vertical;
    cursor: default;
    display: -webkit-box;
    flex-shrink: 1;
    font-size: 14px;
    -webkit-line-clamp: 4;
    opacity: 0.6;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  .btn-primary {
    //height: 24px;
    font-size: 14px;
    padding: 2px 17px;
  }

  .chart-error-icon {
    font-size: 58px;
    color: #9799ac;
    margin-bottom: 17px;
  }
}
</style>
