<template>
  <div>
    <template>
      <template v-for="(row, index) in recordsForDisplay">
        <div :key="index">
          <slot :row="row">
            <div class="btn-row cursor-pointer" @click.stop="handleClickRecord(row)">
              <h4 :title="row[keyForDisplay]" class="text-nowrap my-1">{{ row[keyForDisplay] }}</h4>
            </div>
          </slot>
        </div>
      </template>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { StringUtils } from '@/utils/StringUtils';
import { cloneDeep } from 'lodash';

@Component
export default class DataListing extends Vue {
  @Prop({ required: true, type: Array })
  private readonly records!: any[];

  @Prop({ required: false, type: String, default: 'label' })
  private readonly keyForDisplay!: string;

  @Prop({ required: false, type: String })
  private readonly keyForValue?: string;

  private get recordsForDisplay(): string[][] {
    return cloneDeep(this.records).sort((record, nexRecord) => StringUtils.compare(record[this.keyForDisplay], nexRecord[this.keyForDisplay]));
  }

  @Emit('onClick')
  private handleClickRecord(row: any) {
    if (this.keyForValue) {
      return row[this.keyForValue];
    } else {
      return row;
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.btn-row {
  padding: 6px 12px;
  @include btn-menu-item();

  > h4 {
    @include regular-text();
    font-size: 14px;
    cursor: pointer;

    font-weight: inherit;
    color: inherit;
  }
}
</style>
