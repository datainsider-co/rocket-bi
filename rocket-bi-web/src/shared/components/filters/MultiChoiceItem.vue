<template>
  <div :disabled="disabled" class="choice-item cursor-pointer" @click="handClickItem">
    <template v-if="isSelected && disabled">
      <ActiveMultiChoiceIcon color="#D6D6D6" />
    </template>
    <template v-else-if="isSelected">
      <ActiveMultiChoiceIcon color="var(--background-active, #597Fff)" />
    </template>
    <template v-else>
      <DeactivateMultiChoiceIcon color="var(--background-de-active, #9799AC)" />
    </template>
    <div class="single-line">{{ item.displayName }}</div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
@Component({})
export default class MultiChoiceItem extends Vue {
  @Prop({ required: true })
  private readonly item!: SelectOption;

  @Prop({ type: Boolean, default: false })
  isSelected!: boolean;

  @Prop({ required: false, default: false })
  disabled!: boolean;

  private handClickItem() {
    if (!this.disabled) {
      this.$emit('onSelectItem', this.item);
    }
  }
}
</script>
