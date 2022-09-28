<template>
  <div v-if="isShowMessage" class="message-container">
    <pre class="text" :class="{ error: isError, warning: isWarning, info: isInfo, success: isSuccess }">
       {{ message }}
    </pre>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

export enum MessageType {
  INFO = 0,
  SUCCESS = 1,
  WARNING = 2,
  ERROR = 3
}

@Component
export default class MessageContainer extends Vue {
  @Prop({ required: false, type: Number, default: 3 })
  messageType!: MessageType;

  @Prop({ required: true, type: String })
  message!: string;

  get isShowMessage(): boolean {
    return this.message !== '';
  }

  get isInfo(): boolean {
    return this.messageType === MessageType.INFO;
  }

  get isSuccess(): boolean {
    return this.messageType === MessageType.SUCCESS;
  }

  get isWarning(): boolean {
    return this.messageType === MessageType.WARNING;
  }

  get isError(): boolean {
    return this.messageType === MessageType.ERROR;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.message-container {
  //background-color: var(--primary);
  //width: 100%;
  //height: 100%;
  .text {
    @include regular-text-14();
  }

  pre {
    white-space: pre-wrap;
  }

  .error {
    color: var(--danger);
  }
  .info {
    color: var(--text-color);
  }
  .success {
    color: var(--success);
  }
  .warning {
    color: var(--warning);
  }
}
</style>
