<template>
  <div class="chip-listing-area">
    <template v-if="canShowFull">
      <ChipButton
        v-for="(chip, index) in listChipData"
        :key="index"
        :showIconRemove="chip.isShowRemove"
        :title="chip.title"
        @click="handleClickChip"
        @onRemove="removeChipAt(index)"
      >
      </ChipButton>
    </template>
    <template v-else>
      <ChipButton
        v-for="(chip, index) in partOfListChipData"
        :key="index"
        :showIconRemove="chip.isShowRemove"
        :title="chip.title"
        @click="handleClickChip"
        @onRemove="removeChipAt(index)"
      >
      </ChipButton>
      <ChipButton :showIconRemove="false" :title="`+${remainingQuality}`" @click="handleClickChip"></ChipButton>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import ChipButton from './ChipButton.vue';
import { ListUtils } from '@/utils';

export interface ChipData {
  title: string;
  isShowRemove: boolean;
}

@Component({
  components: { ChipButton }
})
export default class ChipListing extends Vue {
  @Prop({ type: Number, default: 3 })
  maxChipShowing!: number;

  @Prop({ required: true })
  listChipData!: ChipData[];

  private get canShowFull(): boolean {
    if (ListUtils.isEmpty(this.listChipData)) {
      return true;
    } else {
      return ListUtils.isNotEmpty(this.listChipData) && this.maxChipShowing >= this.listChipData.length;
    }
  }

  private get partOfListChipData(): ChipData[] {
    return this.listChipData.slice(0, this.maxChipShowing);
  }

  private get remainingQuality(): number {
    return this.listChipData.length - this.maxChipShowing;
  }

  @Emit('removeAt')
  private removeChipAt(index: number): number {
    return index;
  }

  @Emit('onChipClicked')
  private handleClickChip(): void {
    return void 0;
  }
}
</script>

<style lang="scss" scoped>
.chip-listing-area {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  height: 100%;
  justify-content: flex-start;

  list-style-type: none;

  > div:not(first-child) {
    margin: 1px 4px 0;
  }
}
</style>
