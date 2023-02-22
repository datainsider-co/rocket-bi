<template>
  <div class="premium-feature">
    <MultiChoiceItem
      :disabled="feature.isSubscribed"
      class="premium-feature-choice"
      :item="multiChoiceItem"
      :is-selected="feature.isSelected || feature.isSubscribed"
      @onSelectItem="handleSelectFeature"
    ></MultiChoiceItem>
    <div class="text-left text-truncate">
      <div class="premium-feature-name text-truncate">{{ feature.name }}</div>
      <div class="premium-feature-description text-truncate">{{ feature.description }}</div>
    </div>
    <div class="premium-feature-price">
      <div :class="{ 'mr-2': feature.isSubscribed, 'mr-3': !feature.isSubscribed }">{{ feature.price }}$/month</div>
      <div v-if="feature.isSubscribed" class="d-flex align-items-center">
        | <DiButton class="mr-2" title="Cancel" @click="cancelFeature(feature)"></DiButton>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ProductInfo } from '@core/billing';
import MultiChoiceItem from '@/shared/components/filters/MultiChoiceItem.vue';
import { SelectOption } from '@/shared';
@Component({
  components: { MultiChoiceItem }
})
export default class PremiumFeature extends Vue {
  @Prop()
  private feature!: ProductInfo;

  private get multiChoiceItem(): SelectOption {
    return {
      displayName: '',
      id: this.feature.id
    } as SelectOption;
  }

  private handleSelectFeature() {
    if (!this.feature.isSubscribed) {
      this.feature.isSelected = !this.feature.isSelected;
    }
  }

  private cancelFeature(feature: ProductInfo) {
    this.$emit('cancel', feature);
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.premium-feature {
  display: flex;
  align-items: center;

  background: rgba(250, 250, 251, 1);
  border-radius: 12px;
  padding: 16px 0 16px 16px;

  &-choice {
    margin-right: 12px;
    > div {
      margin-left: 0;
      display: none;
    }
    svg {
      scale: 1;
      width: 24px;
      height: 24px;
    }
  }

  &-name {
    @include regular-text();
    line-height: 28.13px;
    font-size: 24px;
    font-weight: 500;
  }

  &-description {
    @include regular-text();
    line-height: 19px;
    font-size: 16px;
  }
  &-price {
    margin-left: auto;
    @include regular-text();
    line-height: 19px;
    font-size: 16px;
    font-weight: 500;

    display: flex;
    align-items: center;

    .di-button {
      color: var(--accent) !important;
    }
  }
}
</style>
