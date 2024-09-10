<template>
  <div class="qkb-bot-ui" :class="uiClasses">
    <transition name="qkb-fadeUp">
      <div class="qkb-board" v-if="botActive">
        <BoardHeader :bot-title="optionsMain.botTitle" @close-bot="botToggle" />
        <BoardContent :bot-typing="botTyping" :main-data="messages" />
        <BoardAction
          ref="boardAction"
          :input-disable="inputDisable"
          :input-placeholder="optionsMain.inputPlaceholder"
          :input-disable-placeholder="optionsMain.inputDisablePlaceholder"
          @msg-send="sendMessage"
        />
      </div>
    </transition>

    <div class="qkb-bot-bubble">
      <button class="qkb-bubble-btn" @click="botToggle">
        <slot name="bubbleButton">
          <transition name="qkb-scaleUp">
            <img class="qkb-bubble-btn-icon qkb-bubble-btn-icon--open" v-if="!botActive" key="1" src="../assets/icons/bubble_2.svg" alt="" />
            <img class="qkb-bubble-btn-icon qkb-bubble-btn-icon--close" v-else key="2" src="../assets/icons/close.svg" alt="" />
          </transition>
        </slot>
      </button>
    </div>

    <AppStyle :options="optionsMain" />

    <div class="qkb-preload-image">
      <div class="qkb-msg-avatar__img" v-if="optionsMain.botAvatarImg"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import EventBus from '../helpers/EventBus';
import Config from '../config';

import BoardHeader from './Board/BoardHeader.vue';
import BoardContent from './Board/BoardContent.vue';
import BoardAction from './Board/BoardAction.vue';
import AppStyle from './AppStyle.vue';

@Component({
  components: {
    BoardHeader,
    BoardContent,
    BoardAction,
    AppStyle
  }
})
export default class VueBotUI extends Vue {
  @Prop() options!: any;
  @Prop() messages!: any[];
  @Prop() botTyping!: boolean;
  @Prop() inputDisable!: boolean;
  @Prop() isOpen!: boolean;
  @Prop() openDelay!: number;

  @Ref()
  private readonly boardAction?: BoardAction;

  botActive = false;
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

  get optionsMain() {
    return { ...this.defaultOptions, ...this.options };
  }

  get uiClasses() {
    const classes = [];

    if (this.optionsMain.animation) {
      classes.push('qkb-bot-ui--animate');
    }

    return classes;
  }

  created() {
    if (this.isOpen) {
      if (this.openDelay) {
        setTimeout(this.botOpen, this.openDelay);
      } else {
        this.botToggle();
      }
    }
  }

  mounted() {
    document.addEventListener(Config.EVENT_OPEN, this.botOpen);
    document.addEventListener(Config.EVENT_CLOSE, this.botClose);
    document.addEventListener(Config.EVENT_TOGGLE, this.botToggle);
  }

  beforeDestroy() {
    EventBus.$off('select-button-option');
  }

  botOpen() {
    if (!this.botActive) {
      this.botToggle();
    }
  }

  botClose() {
    if (this.botActive) {
      this.botToggle();
    }
  }

  botToggle() {
    this.botActive = !this.botActive;

    if (this.botActive) {
      EventBus.$on('select-button-option', this.selectOption);
      this.$emit('init');
    } else {
      EventBus.$off('select-button-option');
      this.$emit('destroy');
    }
  }

  sendMessage(value: any) {
    this.$emit('msg-send', value);
  }

  selectOption(value: any) {
    this.$emit('msg-send', value);
  }

  expandText(text: string) {
    this.boardAction?.expandText(text);
  }
}
</script>

<style src="../assets/scss/_app.scss" lang="scss"></style>
