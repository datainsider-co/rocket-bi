<template>
  <div class="qkb-msg-bubble-component qkb-msg-bubble-component--single-text">
    <div class="qkb-msg-bubble-component__text" v-html="mainData.text"></div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';

@Component
export default class SingleText extends Vue {
  @Prop() mainData!: ChatMessageData;
}
</script>
