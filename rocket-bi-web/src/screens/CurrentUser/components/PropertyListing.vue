<template>
  <div class="property-listing-container">
    <div class="property-listing-container-item" v-for="item in propertyListingItems" :key="item.title">
      <div class="property-listing-container-item-label">{{ item.title }}</div>
      <div class="property-listing-container-item-content">
        <div v-if="item.value" class="text-truncate w-100 h-100" :class="{ 'font-weight-semi-bold': item.isBoldText }">
          {{ item.value }}
        </div>
        <img v-else-if="item.imgSrc" alt="Avatar" class="org-logo avatar" :src="item.imgSrc" @error="$event.target.src = item.defaultImgSrc" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

export interface PropertyListingItem {
  imgSrc?: string;
  defaultImgSrc?: string;
  value?: string;
  isBoldText?: boolean;
  title: string;
}

@Component
export default class PropertyListing extends Vue {
  @Prop({ required: true })
  private readonly propertyListingItems!: PropertyListingItem[];
}
</script>
<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.property-listing-container {
  background-color: var(--secondary-2);
  display: flex;
  flex-direction: column;
  padding: 0 24px;
  border-radius: 12px;

  &-item {
    display: flex;
    border-bottom: 1px solid #f0f0f0;
    padding: 15px 0;
    align-items: center;
    text-align: left;
    min-height: 67px;
    width: 100%;

    .org-logo {
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }

    &:last-child {
      border-bottom: none;
    }

    &-label {
      margin-right: 10px;
      width: 140px;
      @include medium-text();
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-content {
      flex: 1;
      position: relative;
      min-height: 17px;
      margin: 0 auto;
      > div {
        position: absolute;
        @include regular-text-14();
      }
    }
  }
}
</style>
