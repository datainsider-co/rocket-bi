<template>
  <div class="qkb-board-action" :class="actionClass" :style="actionStyle">
    <div class="qkb-board-action__wrapper">
      <div class="qkb-board-action__msg-box">
        <textarea
          class="qkb-board-action__input"
          v-model="messageText"
          ref="qkbMessageInput"
          :disabled="inputDisable"
          :placeholder="inputPlaceholder"
          @keydown.enter="sendMessage"
        ></textarea>
        <div class="qkb-board-action__disable-text" v-if="inputDisablePlaceholder && inputDisable">
          <span>{{ inputDisablePlaceholder }}</span>
        </div>
      </div>
      <div class="qkb-board-action__extra">
        <slot name="actions"></slot>
        <button class="qkb-action-item qkb-action-item--send" @click="sendMessage">
          <slot name="sendButton">
            <img src="../../assets/icons/send.svg" alt="" class="qkb-action-icon qkb-action-icon--send" />
          </slot>
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { min } from 'lodash';

@Component({ components: {} })
export default class BoardAction extends Vue {
  @Prop() inputPlaceholder!: string;
  @Prop() inputDisablePlaceholder!: string;
  @Prop({ default: false }) inputDisable!: boolean;

  @Ref()
  private readonly qkbMessageInput?: HTMLTextAreaElement;

  messageText: string | null = null;
  private height = '46px';

  get actionClass(): string[] {
    const actionClasses: string[] = [];

    if (this.inputDisable) {
      actionClasses.push('qkb-board-action--disabled');
    }

    if (this.messageText) {
      actionClasses.push('qkb-board-action--typing');
    }

    // TODO: sending

    return actionClasses;
  }

  get actionStyle(): any {
    return { height: this.height };
  }

  @Watch('messageText')
  onMessageChanged() {
    if (this.messageText === null || this.messageText?.trim()?.length === 0) {
      this.height = '46px';
      return;
    }
    const heightTextArea = this.qkbMessageInput?.scrollHeight === 0 ? 30 : this.qkbMessageInput!.scrollHeight;
    this.height = `${min([16 + heightTextArea, 200])}px`;
  }

  sendMessage(event: KeyboardEvent) {
    if (event.shiftKey) {
      return;
    }
    if ((this.messageText?.trim()?.length ?? 0) > 0) {
      this.$emit('msg-send', { text: this.messageText });
      this.messageText = null;
      event.preventDefault();
    }
  }

  expandText(text: string) {
    if (this.messageText) {
      this.messageText.concat(text);
    } else {
      this.messageText = text;
    }
    this.$nextTick(() => {
      this.qkbMessageInput!.focus();
      this.qkbMessageInput!.scrollTop = this.qkbMessageInput!.scrollHeight;
      this.onMessageChanged();
    });
  }
}
</script>
