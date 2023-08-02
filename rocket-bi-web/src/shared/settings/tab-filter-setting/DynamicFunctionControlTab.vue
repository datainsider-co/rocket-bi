<template>
  <PanelHeader ref="panel" header="Tab controls" target-id="data-point-tab">
    <div class="data-point-tab">
      <DropdownSetting
        v-if="enableDirectionSetting"
        id="direction-tab"
        :options="directionOptions"
        :value="direction"
        class="mb-3"
        label="Position"
        size="full"
        @onChanged="handleDirectionChanged"
      />
      <!--      <DropdownSetting id="display-tab" :options="displayOptions" :value="displayAs" class="mb-3" label="Type" size="full" @onChanged="handleDisplayChanged" />-->
      <!--      <DropdownSetting-->
      <!--        v-if="enableDirectionSetting"-->
      <!--        id="tab-align"-->
      <!--        :options="alignOptions"-->
      <!--        :value="tabAlign"-->
      <!--        class="mr-2 mb-3"-->
      <!--        label="Align"-->
      <!--        size="full"-->
      <!--        @onChanged="handleAlignChanged"-->
      <!--      />-->
      <div v-if="!isDropdown" class="row-config-container">
        <ColorSetting
          id="de-active-color"
          :default-color="defaultSetting.deActiveColor"
          :value="deactivateColor"
          label="Background inactive"
          size="half"
          style="margin-right: 12px"
          @onChanged="handleDeActivateColorChanged"
        />
        <ColorSetting
          id="active-color"
          :default-color="defaultSetting.activeColor"
          :value="activeColor"
          label="Background active"
          size="half"
          @onChanged="handleActivateColorChanged"
        />
      </div>
      <DefaultValueSetting :setting="setting.default" @onReset="handleResetDefaultValue" @onSaved="handleSetDefaultValue" />
      <RevertButton class="mb-3" style="text-align: right" @click="handleRevert" />
    </div>
  </PanelHeader>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { SettingKey, TabOptionData } from '@core/common/domain';
import { ChartType, Direction, SelectOption, TabFilterDisplay } from '@/shared';
import PanelHeader from '@/screens/chart-builder/setting-modal/PanelHeader.vue';
import { FlexAlignOptions } from '@/shared/settings/common/options/AlignOptions';
import DiButton from '@/shared/components/common/DiButton.vue';
import DiShadowButton from '@/shared/components/common/DiShadowButton.vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import DefaultValueSetting from '@/shared/settings/tab-filter-setting/DefaultValueSetting.vue';

@Component({ components: { DefaultValueSetting, DiIconTextButton, DiShadowButton, DiButton, PanelHeader } })
export default class DynamicFunctionControlTab extends Vue {
  @Prop({ required: false, type: Object })
  setting?: TabOptionData;

  @Prop({ required: false })
  widgetType?: ChartType;
  @Ref()
  private panel!: PanelHeader;
  private readonly defaultSetting = {
    activeColor: 'var(--tab-filter-background-active)',
    deActiveColor: 'var(--tab-filter-background-de-active)',
    direction: 'row',
    displayAs: 'normal',
    align: 'center'
  };
  private readonly alignOptions = FlexAlignOptions;

  private get direction(): string {
    return this.setting?.direction ?? 'row';
  }

  private get displayAs(): string {
    return this.setting?.displayAs ?? TabFilterDisplay.normal;
  }

  private get activeColor(): string {
    return this.setting?.activeColor ?? this.defaultSetting.activeColor;
  }

  private get deactivateColor(): string {
    return this.setting?.deActiveColor ?? this.defaultSetting.deActiveColor;
  }

  private get directionOptions(): SelectOption[] {
    return [
      {
        displayName: 'Row',
        id: Direction.row
      },
      {
        displayName: 'Column',
        id: Direction.column
      }
    ];
  }

  private get tabAlign(): string {
    return this.setting?.align ?? this.defaultSetting.align;
  }

  private get displayOptions(): SelectOption[] {
    return [
      {
        displayName: 'Button',
        id: TabFilterDisplay.normal
      },
      {
        displayName: 'Single choice',
        id: TabFilterDisplay.singleChoice
      },
      {
        displayName: 'Multi choice',
        id: TabFilterDisplay.multiChoice
      },
      {
        displayName: 'Dropdown',
        id: TabFilterDisplay.dropDown
      }
    ];
  }

  private get isDropdown(): boolean {
    return this.displayAs === TabFilterDisplay.dropDown;
  }

  mounted() {
    this.panel.expand();
  }

  private handleDirectionChanged(newDirectory: string) {
    return this.$emit('onChanged', 'direction', newDirectory);
  }

  private handleDisplayChanged(newDisplay: string) {
    return this.$emit('onChanged', 'displayAs', newDisplay);
  }

  private handleActivateColorChanged(newColor: string) {
    return this.$emit('onChanged', 'activeColor', newColor);
  }

  private handleDeActivateColorChanged(newColor: string) {
    return this.$emit('onChanged', 'deActiveColor', newColor);
  }

  private handleAlignChanged(newAlign: string) {
    return this.$emit('onChanged', 'align', newAlign);
  }

  private handleRevert() {
    const settingAsMap: Map<SettingKey, boolean | string | number | null> = new Map();
    settingAsMap.set('direction', this.defaultSetting.direction);
    // settingAsMap.set('displayAs', this.defaultSetting.displayAs);
    settingAsMap.set('activeColor', this.defaultSetting.activeColor);
    settingAsMap.set('deActiveColor', this.defaultSetting.deActiveColor);
    settingAsMap.set('default.setting', null);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleSetDefaultValue(defaultValue: any) {
    this.$emit('onChanged', 'default.dynamicFunction', defaultValue.value);
    this.$emit('onDefaultChanged', defaultValue);
  }

  private handleResetDefaultValue() {
    this.$emit('onChanged', 'default.dynamicFunction', null);
    this.$emit('onDefaultChanged', null);
  }

  private get enableDirectionSetting(): boolean {
    switch (this.widgetType) {
      case ChartType.DropDownFilter:
      case ChartType.TabInnerFilter:
        return false;
      default:
        return true;
    }
  }
}
</script>
