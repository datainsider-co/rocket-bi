<template>
  <div class="choice-item cursor-pointer" @click="handClickItem">
    <template v-if="isSelected">
      <ActiveSingleChoiceIcon color="var(--background-active, #57F)" />
    </template>
    <template v-else>
      <DeactivateSingleChoiceIcon color="var(--background-de-active, #9799AC)" />
    </template>
    <slot>
      <div class="single-line">{{ item.displayName }}</div>
    </slot>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';

@Component
export default class SingleChoiceItem extends Vue {
  @Prop({ type: Boolean, default: false })
  isSelected!: boolean;
  @Prop({ required: true })
  private readonly item!: SelectOption;

  private handClickItem(event: MouseEvent): void {
    this.$emit('onSelectItem', this.item, event);
  }
}
</script>
