<template>
  <div class="d-flex align-items-center justify-content-between align-container" style="height: 34px;">
    <b-icon-text-left :class="`${iconClass(`left`)}`" @click="selectAlign(`left`)" />
    <b-icon-text-center :class="`${iconClass(`center`)}`" @click="selectAlign(`center`)" />
    <b-icon-text-right :class="`${iconClass(`right`)}`" @click="selectAlign(`right`)" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';

@Component({})
export default class AlignComponent extends Vue {
  @Prop({ required: true })
  settingItem!: SettingItem;

  private value = this.settingItem.value || this.settingItem.defaultValue;

  private selectAlign(newAlign: string): void {
    if (newAlign != this.value) {
      this.value = newAlign;
      this.$emit('change', newAlign);
    }
  }

  private iconClass(align: string) {
    const classString = 'btn-icon btn-ghost di-popup ic-16';
    return this.value == align ? `${classString} active` : `${classString}`;
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.align-container {
  height: 34px;

  > .btn-icon {
    padding: 8px;
    font-size: 20px;
  }
  .active {
    color: var(--accent);
  }
}

.align-item {
  @include ic-16;
}
</style>
