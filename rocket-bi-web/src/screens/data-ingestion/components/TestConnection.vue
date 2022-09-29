<template>
  <div class="d-flex w-100 flex-row justify-content-between">
    <div class="d-flex w-60 cursor-pointer align-items-center" @click="handleTestConnection">
      <img src="@/assets/icon/data_ingestion/ic_connect.svg" class="ic-16" alt="" />
      <div class="ml-1 text-connection">Test Connection</div>
    </div>
    <div v-if="isTestConnection" class="col-5 p-0 text-center">
      <BSpinner v-if="isLoading" small class="text-center"></BSpinner>
      <div v-else :class="statusClass" class="text-right">{{ statusMessage }}</div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

export enum ConnectionStatus {
  Failed = 'failed',
  Success = 'success',
  Loading = 'loading'
}

@Component
export default class TestConnection extends Vue {
  static readonly CONNECTION_FAILED = 'Connection failed';
  static readonly CONNECTION_SUCCESS = 'Connection success';
  private isTestConnection = false;

  @Prop({ required: true })
  status!: ConnectionStatus;

  private get statusClass() {
    return {
      'status-error': this.status === ConnectionStatus.Failed,
      'status-success': this.status === ConnectionStatus.Success
    };
  }

  private get isLoading(): boolean {
    return this.status === ConnectionStatus.Loading;
  }

  private get statusMessage(): string {
    switch (this.status) {
      case ConnectionStatus.Success:
        return TestConnection.CONNECTION_SUCCESS;
      case ConnectionStatus.Failed:
        return TestConnection.CONNECTION_FAILED;
      default:
        return TestConnection.CONNECTION_FAILED;
    }
  }

  private handleTestConnection() {
    this.$emit('handleTestConnection');
    this.isTestConnection = true;
  }
}
</script>
<style lang="scss" scoped>
.status-error {
  color: var(--warning);
}

.status-success {
  color: var(--success);
}
</style>
