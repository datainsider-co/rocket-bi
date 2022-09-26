<template>
  <DiButton :id="id" v-b-tooltip.d1000.top.viewport :title="title" class="tab-item-mini" border :class="{ selected: isSelected }" @click.stop="handClickItem">
  </DiButton>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { IdGenerator } from '@/utils/id_generator';

@Component({
  components: { DiButton }
})
export default class NormalTabItem extends Vue {
  @Prop({ required: true })
  private readonly item!: SelectOption;

  @Prop({ type: Boolean, default: false })
  isSelected!: boolean;

  private get id(): string {
    return IdGenerator.generateButtonId('normal-tab-item', +this.item.id);
  }

  private get title(): string {
    return `${this.item.displayName}`;
  }

  @Emit('onSelectItem')
  private handClickItem(): SelectOption {
    return this.item;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.tab-item-mini {
  padding: 8px;
  margin: 0;
  display: flex;
  align-items: center;
  width: fit-content;
  background-color: var(--background-de-active, var(--tab-filter-background-de-active)) !important;
  border: 1px solid var(--tab-border-color);
  color: var(--tab-filter-de-active);
  height: 32px;
  .text-center {
    line-height: 1;

    img[class~='ic-16'] {
      margin-right: 0;
    }
  }

  ::v-deep {
    .title {
      opacity: 1;
    }
  }
}

.selected {
  background-color: var(--background-active, var(--tab-filter-backgroundr-active)) !important;
  color: var(--tab-filter-active) !important;
  border: unset !important;
}
</style>
