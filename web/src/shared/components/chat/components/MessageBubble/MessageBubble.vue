<template>
  <div class="qkb-msg-bubble" :class="bubbleClass">
    <div class="qkb-msg-avatar" v-if="isBot">
      <div class="qkb-msg-avatar__img">&nbsp;</div>
    </div>
    <component v-if="componentType" :is="componentType" :main-data="message"></component>
    <div class="qkb-msg-bubble__time" v-if="message.createdAt">
      {{ message.createdAt }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import SingleText from './SingleText.vue';
import ButtonOptions from './ButtonOptions.vue';
import { OpenAiMessageRole } from '@core/chat-bot/domain/OpenAiMessageRole';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';

@Component({
  components: {
    SingleText,
    ButtonOptions
  }
})
export default class MessageBubble extends Vue {
  @Prop() message!: ChatMessageData;

  get bubbleClass() {
    return this.isBot ? 'qkb-msg-bubble--bot' : 'qkb-msg-bubble--user';
  }

  get isBot(): boolean {
    switch (this.message.role) {
      case OpenAiMessageRole.user:
        return false;
      default:
        return true;
    }
  }

  get componentType() {
    let type = '';

    switch (this.message.type) {
      case 'button':
        type = 'ButtonOptions';
        break;
      default:
        type = 'SingleText';
    }

    return type;
  }
}
</script>
