<template>
  <div class="datasource-item cursor-pointer d-flex flex-column" @click="handClickItem">
    <img width="118" height="80" :src="require(`@/assets/icon/data_ingestion/datasource/${item.src}`)" alt="" />
    <div class="title">
      <div class="  h-100 d-flex align-items-center justify-content-center">{{ item.title }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { ItemData } from '@/shared';
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';

@Component
export default class DataSourceItem extends Vue {
  @Prop({ required: true })
  item!: ItemData;

  @Emit('onClickItem')
  private handClickItem(): ItemData {
    return this.item;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';
.datasource-item {
  cursor: pointer;
  width: 118px;
  height: 126px;
  margin: 12px;
  border-radius: 4px;
  border: var(--data-source-item-border);
  overflow: hidden;
  > img {
    width: auto;
  }

  .title {
    height: 46px;
    width: 100%;
    background: var(--data-source-item-bg);
    > div {
      @include regular-text();
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: 0.2px;
      color: var(--text-color);
    }
  }
}
</style>
