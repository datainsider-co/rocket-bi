<template>
  <img v-if="isIcon" :src="require(`@/assets/icon/charts/${item.displayName}`)" />
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';

@Component({})
export default class FlatChoiceItem extends Vue {
  @Prop({ required: true })
  private readonly item!: SelectOption;

  @Prop({ type: Boolean, default: false })
  isSelected!: boolean;

  @Emit('onSelectItem')
  private handClickItem(): SelectOption {
    return this.item;
  }

  private get isIcon(): boolean {
    return this.item.displayName.includes('.svg');
  }
}
</script>
