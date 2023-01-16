<template>
  <PanelHeader ref="panel" header="Tab controls" target-id="data-point-tab">
    <div class="data-point-tab">
      <DropdownSetting
        v-if="enableDirectionSetting && !isDropdown"
        id="direction-tab"
        :options="directionOptions"
        :value="direction"
        class="mb-3"
        :label="`${configSetting['position'].label}`"
        :hint="`${configSetting['position'].hint}`"
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
          :label="`${configSetting['inActive.background'].label}`"
          :hint="`${configSetting['inActive.background'].hint}`"
          size="half"
          style="margin-right: 12px"
          @onChanged="handleDeActivateColorChanged"
        />
        <ColorSetting
          id="active-color"
          :default-color="defaultSetting.activeColor"
          :value="activeColor"
          :label="`${configSetting['active.background'].label}`"
          :hint="`${configSetting['active.background'].hint}`"
          size="half"
          @onChanged="handleActivateColorChanged"
        />
      </div>
      <ToggleSetting
        v-if="!isDropdown"
        id="enable-search-setting"
        :value="enableSearch"
        :label="`${configSetting['search.enabled'].label}`"
        :hint="`${configSetting['search.enabled'].hint}`"
        @onChanged="handleSearchChanged"
      />
      <InputSetting
        v-if="!isDropdown"
        :disabled="enableSearch"
        id="search-holder-setting"
        class="mb-2"
        size="full"
        :value="searchPlaceholder"
        :label="`${configSetting['search.placeHolder'].label}`"
        :hint="`${configSetting['search.placeHolder'].hint}`"
        :placeholder="`${configSetting['search.placeHolder'].placeHolder}`"
        @onChanged="handleSearchPlaceHolderChanged"
      />
      <DefaultValueSetting
        :setting="setting.default"
        :title="`${configSetting['default.set'].label}`"
        :hint="`${configSetting['default.set'].hint}`"
        @onReset="handleResetDefaultValue"
        @onSaved="handleSetDefaultValue"
      />
      <RevertButton class="mb-3 pr-3" style="text-align: right" @click="handleRevert" />
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
export default class TabFilterControlTab extends Vue {
  private readonly configSetting = window.chartSetting['tabControl.tab'];

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
    switch (this.displayAs) {
      case TabFilterDisplay.singleChoice:
      case TabFilterDisplay.multiChoice:
        return this.setting?.choiceActiveColor ?? this.defaultSetting.activeColor;
      default:
        return this.setting?.activeColor ?? this.defaultSetting.activeColor;
    }
  }

  private get deactivateColor(): string {
    switch (this.displayAs) {
      case TabFilterDisplay.singleChoice:
      case TabFilterDisplay.multiChoice:
        return this.setting?.choiceDeActiveColor ?? this.defaultSetting.deActiveColor;
      default:
        return this.setting?.deactivateColor ?? this.defaultSetting.deActiveColor;
    }
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
    switch (this.displayAs) {
      case TabFilterDisplay.singleChoice:
      case TabFilterDisplay.multiChoice:
        return this.$emit('onChanged', 'choiceActiveColor', newColor);
      default:
        return this.$emit('onChanged', 'activeColor', newColor);
    }
  }

  private handleDeActivateColorChanged(newColor: string) {
    switch (this.displayAs) {
      case TabFilterDisplay.singleChoice:
      case TabFilterDisplay.multiChoice:
        return this.$emit('onChanged', 'choiceDeActiveColor', newColor);
      default:
        return this.$emit('onChanged', 'deActiveColor', newColor);
    }
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
    settingAsMap.set('choiceActiveColor', this.defaultSetting.activeColor);
    settingAsMap.set('choiceDeActiveColor', this.defaultSetting.deActiveColor);
    settingAsMap.set('search.enabled', true);
    settingAsMap.set('search.placeholder', 'Search...');
    settingAsMap.set('default.setting', null);
    this.$emit('onMultipleChanged', settingAsMap);
  }

  private handleSetDefaultValue(value: any) {
    this.$emit('onChanged', 'default.setting', value);
    this.$emit('onDefaultChanged', value);
  }

  private handleResetDefaultValue() {
    this.$emit('onChanged', 'default.setting', null);
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

  private get enableSearch(): boolean {
    return this.setting?.search?.enabled ?? true;
  }

  private get searchPlaceholder(): string {
    return this.setting?.search?.placeholder ?? 'Search...';
  }

  private handleSearchChanged(enabled: boolean) {
    this.$emit('onChanged', 'search.enabled', enabled);
  }

  private handleSearchPlaceHolderChanged(text: string) {
    this.$emit('onChanged', 'search.placeholder', text);
  }
}
</script>
