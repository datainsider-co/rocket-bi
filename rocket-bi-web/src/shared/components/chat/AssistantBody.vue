<template>
  <transition name="qkb-fadeUp">
    <div class="qkb-board" v-if="visible">
      <!--      <BoardHeader :bot-title="optionsMain.botTitle" @close-bot="botToggle" />-->
      <BoardContent :bot-typing="botTyping" :main-data="messages" />
      <BoardAction
        ref="boardAction"
        :input-disable="inputDisable"
        :input-placeholder="optionsMain.inputPlaceholder"
        :input-disable-placeholder="optionsMain.inputDisablePlaceholder"
        @msg-send="sendMessage"
      />
      <AppStyle :options="optionsMain" />
    </div>
  </transition>
</template>

<script lang="ts">
import { Component, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import DiRenameModal from '@/shared/components/DiRenameModal.vue';
import { Log } from '@core/utils';
import AppStyle from '@/shared/components/chat/components/AppStyle.vue';
import BoardContent from '@/shared/components/chat/components/Board/BoardContent.vue';
import BoardHeader from '@/shared/components/chat/components/Board/BoardHeader.vue';
import BoardAction from '@/shared/components/chat/components/Board/BoardAction.vue';
import EventBus from '@/shared/components/chat/helpers/EventBus';

@Component({
  components: { DiRenameModal, AppStyle, BoardContent, BoardHeader, BoardAction }
})
export default class AssistantBody extends Vue {
  @Model('change', { default: false })
  visible!: boolean;
  @Prop() options!: any;
  @Prop() messages!: any[];
  @Prop() botTyping!: boolean;
  @Prop() inputDisable!: boolean;

  @Ref()
  private readonly boardAction?: BoardAction;

  defaultOptions = {
    botTitle: 'Chatbot',
    colorScheme: '#1b53d0',
    textColor: '#fff',
    bubbleBtnSize: 56,
    animation: true,
    boardContentBg: '#fff',
    botAvatarSize: 32,
    botAvatarImg: 'http://placehold.it/200x200',
    msgBubbleBgBot: '#f0f0f0',
    msgBubbleColorBot: '#000',
    msgBubbleBgUser: '#4356e0',
    msgBubbleColorUser: '#fff',
    inputPlaceholder: 'Message',
    inputDisableBg: '#fff',
    inputDisablePlaceholder: null
  };

  mounted() {
    EventBus.$on('select-button-option', this.selectOption);
  }

  beforeDestroy() {
    EventBus.$off('select-button-option', this.selectOption);
  }

  selectOption(value: any) {
    this.$emit('msg-send', value);
  }

  get optionsMain() {
    return { ...this.defaultOptions, ...this.options };
  }

  sendMessage(value: any) {
    Log.debug('sendMessage', value);
    this.$emit('msg-send', value);
  }

  expandText(text: string) {
    this.boardAction?.expandText(text);
  }
}
</script>

<style src="./assets/scss/_app.scss" lang="scss" />
