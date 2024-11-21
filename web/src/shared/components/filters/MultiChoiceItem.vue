<template>
  <div class="choice-item cursor-pointer" @click="handClickItem">
    <template v-if="isSelected">
      <ActiveMultiChoiceIcon color="var(--background-active, #57F)" />
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
import DiButton from '@/shared/components/common/DiButton.vue';
@Component({})
export default class MultiChoiceItem extends Vue {
  @Prop({ required: true })
  private readonly item!: SelectOption;

  @Prop({ type: Boolean, default: false })
  isSelected!: boolean;

  @Emit('onSelectItem')
  private handClickItem(): SelectOption {
    return this.item;
  }
}
</script>
