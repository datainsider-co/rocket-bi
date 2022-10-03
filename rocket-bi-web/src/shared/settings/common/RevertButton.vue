<template>
  <p class="revert-button unselectable" @click="handleRevert">{{ title }}</p>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class RevertButton extends Vue {
  @Prop({ type: String, default: 'Revert to default' })
  title!: string;
  @Emit('click')
  private handleRevert(event: MouseEvent) {
    return event;
  }
}
</script>
