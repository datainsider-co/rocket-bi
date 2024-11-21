<template>
  <div class="qkb-board-content" ref="boardContent">
    <div class="qkb-board-content__bubbles" ref="boardBubbles">
      <MessageBubble v-for="(item, index) in mainData" :key="index" :message="item"></MessageBubble>
      <div class="qkb-board-content__bot-typing" v-if="botTyping">
        <slot name="botTyping">
          <MessageTyping></MessageTyping>
        </slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import MessageBubble from '../MessageBubble/MessageBubble.vue';
import MessageTyping from '../MessageBubble/MessageTyping.vue';

@Component({ components: { MessageBubble, MessageTyping } })
export default class BoardContent extends Vue {
  @Prop({ required: true }) mainData!: any[];
  @Prop({ default: false }) botTyping!: boolean;

  @Watch('mainData')
  onMainDataChanged(newVal: any) {
    this.$nextTick(() => {
      this.updateScroll();
    });
  }

  updateScroll() {
    const contentElm: any = this.$refs.boardContent;
    const offsetHeight = (this.$refs.boardBubbles as HTMLDivElement).offsetHeight;
    contentElm.scrollTop = offsetHeight;
  }
}
</script>
