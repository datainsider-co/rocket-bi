<template>
  <div class="">
    <div class="group-title px-0">
      <ToggleSettingComponent :settingItem="settingItem" @onChanged="handleSettingChanged"></ToggleSettingComponent>
    </div>
    <template v-for="(settingItem, index) in settingItem.innerSettingItems">
      <div :key="index" class="col-6 mar-b-16 px-0" :style="currentStyle" v-if="isNoneComponent(settingItem.type)"></div>
      <GroupSettingComponent
        :style="currentStyle"
        :settingItem="settingItem"
        :key="index"
        v-else-if="isGroupSettingComponent(settingItem.type)"
        @onChanged="handleSettingChanged"
      ></GroupSettingComponent>
      <component
        :key="index"
        class="setting-item mb-2"
        :style="currentStyle"
        :is="settingItem.type"
        :settingItem="settingItem"
        v-else-if="settingItem.type"
        @onChanged="handleSettingChanged"
      >
      </component>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SettingItem } from '@/shared/models';
import { ChartUtils } from '@/utils';
import { MethodProfiler } from '@/shared/profiler/annotation';

@Component
export default class GroupSettingComponent extends Vue {
  @Prop({ required: true })
  settingItem!: SettingItem;

  private get isEnable() {
    return this.settingItem.value;
  }

  private isNoneComponent(type: string) {
    return ChartUtils.isNoneComponent(type);
  }

  private isGroupSettingComponent(type: string) {
    return ChartUtils.isGroupSettingComponent(type);
  }

  private get pointerEvents(): string {
    return this.isEnable ? 'unset' : 'none';
  }

  private get opacity(): string {
    const opacity: number = this.isEnable ? 1 : 0.2;
    return opacity.toString();
  }

  private get currentStyle(): CSSStyleDeclaration {
    return {
      pointerEvents: this.pointerEvents,
      opacity: this.opacity
    } as CSSStyleDeclaration;
  }
  @MethodProfiler({ prefix: 'SettingModal.vue', name: 'handleSettingChanged' })
  private handleSettingChanged(key: string, value: any) {
    this.$emit('onChanged', key, value);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.group-title {
  ::v-deep {
    .toggle-title {
      @include bold-text();
      font-size: 14px;
    }
  }
}
</style>
