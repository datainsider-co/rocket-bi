<template>
  <div class="qkb-msg-bubble-component qkb-msg-bubble-component--button-options">
    <div class="qkb-msg-bubble-component__text">{{ mainData.text }}</div>
    <div class="qkb-msg-bubble-component__options-wrapper">
      <div v-for="(item, index) in mainData.options" :class="{ active: selectedItem === item.value }" :key="index" class="qkb-mb-button-options__item">
        <button v-if="item.action === 'postback'" @click="selectOption(item)" class="qkb-mb-button-options__btn">
          <span>{{ item.text }}</span>
        </button>
        <a target="_blank" v-else :href="item.value" class="qkb-mb-button-options__btn qkb-mb-button-options__url">
          <span>{{ item.text }}</span>
        </a>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator';
import EventBus from '../../helpers/EventBus';
import { ChatMessageData } from '@/shared/components/chat/controller/ChatMessageData';

@Component
export default class ButtonOptions extends Vue {
  @Prop() mainData!: ChatMessageData;

  selectedItem: any = null;

  selectOption(value: any) {
    this.selectedItem = value;
    EventBus.$emit('select-button-option', value);
  }
}
</script>
