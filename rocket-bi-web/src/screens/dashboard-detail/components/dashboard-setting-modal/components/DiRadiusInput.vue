<template>
  <div class="di-radius-input">
    <DiInputComponent
      ref="radiusInput"
      :disabled="isCustomBorderRadius"
      v-model="allRadiusValue"
      class="di-radius-input--input"
      border
      label="Corner radius (px)"
      @enter="() => $emit('enter')"
    />
    <div class="di-radius-input--icon" :active="isCustomBorderRadius" @click="toggleCustomBorderRadius">
      <i class="di-icon-dashed-stroke"></i>
    </div>
    <IndependentCornerInput
      ref="independentCornerInput"
      v-model="radius"
      :style="{
        visibility: isCustomBorderRadius ? 'visible' : 'hidden'
      }"
      class="di-radius-input--input"
      @enter="$emit('enter')"
    />
  </div>
</template>

<script lang="ts">
import { Component, Model, Ref, Vue } from 'vue-property-decorator';
import { NumberUtils } from '@core/utils';
import { RadiusInfo } from '@core/common/domain';
import IndependentCornerInput from '@/screens/dashboard-detail/components/dashboard-setting-modal/components/IndependentCornerInput.vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';

@Component({
  components: {
    IndependentCornerInput,
    DiInputComponent
  }
})
export default class DiRadiusInput extends Vue {
  private isCustomBorderRadius = false;

  @Model('change', { type: Object, default: () => ({}) })
  protected readonly radius!: RadiusInfo;

  @Ref()
  protected readonly independentCornerInput!: IndependentCornerInput;

  @Ref()
  protected readonly radiusInput!: DiInputComponent;

  mounted() {
    this.isCustomBorderRadius = this.radius.isMixed();
  }

  protected toggleCustomBorderRadius(): void {
    this.isCustomBorderRadius = !this.isCustomBorderRadius;
    this.$nextTick(() => {
      this.$nextTick(() => {
        if (this.isCustomBorderRadius) {
          this.independentCornerInput.focus();
        } else {
          this.radiusInput.focus();
          this.radiusInput.selectAll();
        }
      });
    });
  }

  protected get allRadiusValue(): string {
    if (this.radius.isMixed()) {
      return 'Mixed';
    } else {
      return this.radius.topLeft + '';
    }
  }

  protected set allRadiusValue(value: string) {
    if (NumberUtils.isNumber(value) && value >= 0) {
      this.radius.setAllRadius(NumberUtils.toNumber(value));
    } else {
      this.radius.setAllRadius(0);
    }
  }
}
</script>

<style lang="scss">
.di-radius-input {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  &--input {
    flex: 1;
  }

  &--icon {
    font-size: 17.5px;
    width: 24px;
    height: 24px;
    margin: auto 5px 8px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;

    &:hover,
    &[active] {
      background: var(--hover-color);
    }
  }
}
</style>
