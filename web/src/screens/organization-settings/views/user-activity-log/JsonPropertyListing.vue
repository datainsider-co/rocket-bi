<template>
  <div v-if="properties && isObject(properties)" class="property-listing  ">
    <template v-for="(value, key) in properties">
      <div class="property-listing-item" :key="key">
        <div class="property-listing-item-key" :style="{ paddingLeft: `${(level + 1) * padding}px` }" :title="key">{{ key }}</div>
        <div class="property-listing-item-value" :title="value">{{ value }}</div>
      </div>
      <div :key="key + '-level-' + level">
        <JsonPropertyListing :properties="value" :level="level + 1" :padding="padding"></JsonPropertyListing>
      </div>
    </template>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { StringUtils } from '@/utils/StringUtils';
import { isArray, isObject } from 'lodash';

@Component({})
export default class JsonPropertyListing extends Vue {
  @Prop({ required: false, default: 0 })
  private level!: number;
  @Prop()
  private readonly properties!: any;

  @Prop({ required: false, default: 20 })
  private padding!: number;

  private isObject(value: any) {
    return isObject(value);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';
@import '~@/themes/scss/di-variables';
.property-listing {
  .pl-20px {
    padding-left: 20px;
  }
  &-item {
    border-bottom: 1px solid #f0f0f0;
    @include regular-text(0.6px, var(--text-color));
    display: flex;
    align-items: center;

    &-key,
    &-value {
      padding-top: 7px;
      padding-bottom: 8px;

      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    &-key {
      width: 236px;
      font-weight: 500;
      border-right: 1px solid #f0f0f0;
    }
    &-value {
      margin-left: 26px;
      width: calc(100% - 236px - 26px);
    }
  }
}
</style>
