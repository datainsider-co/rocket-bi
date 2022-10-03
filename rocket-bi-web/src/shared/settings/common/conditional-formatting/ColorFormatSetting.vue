<template>
  <div class="color-format-setting">
    <FormatBySettingBar
      id="color"
      :applyTo="colorFormatting.applyTo"
      :formatType="colorFormatting.formatType"
      @onSelectApplyTo="selectApplyTo"
      @onSelectFormatBy="selectFormatBy"
    />
    <header class="color-base-field">
      <DropdownSetting
        id="color-based-on-field"
        :class="{ 'base-field-error': isBaseFieldError }"
        :options="databaseOptions"
        :value="selectedFieldId"
        label="Based on field"
        @onSelected="selectBaseField"
      />
      <template v-if="canSelectSummarization">
        <DropdownSetting
          id="color-summarization"
          :options="summarizationOptions"
          :value="colorFormatting.summarization"
          label="Summarization"
          @onChanged="selectSummarization"
        />
      </template>
      <template v-else>
        <div></div>
      </template>
      <div :class="{ 'specific-picker': isSpecificColor }">
        <template v-if="colorFormatting.formatType === ColorFormatType.ColorScale">
          <DropdownSetting
            id="color-default-formatting"
            :options="defaultColorFormattingOptions"
            :value="selectedDefaultColor"
            label="Default formatting"
            @onChanged="selectDefaultColor"
          />
          <ColorPicker
            v-if="isSpecificColor"
            id="specific-color-picker"
            :allowValueNull="true"
            :defaultColor="defaultValue.specificColor"
            :pickerType="PickerType.OnlyPreview"
            :value="colorFormatting.scale.default.specificColor"
            @change="handleColorChanged"
          />
        </template>
      </div>
    </header>
    <div>
      <template v-if="colorFormatting.formatType === ColorFormatType.ColorScale">
        <ColorScalePanel ref="colorScalePanel" :color.sync="colorFormatting.scale"></ColorScalePanel>
      </template>
      <template v-if="colorFormatting.formatType === ColorFormatType.Rules">
        <RulePanel ref="rulePanel" :rules="colorFormatting.rules.colorRules" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ApplyToType, ColorFormatting, ConditionalFormattingType, DefaultValueFormattingType, Field, FunctionType } from '@core/common/domain';
import { FormattingOptions, FunctionFormattingType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import ColorScalePanel from '@/shared/settings/common/conditional-formatting/ColorScalePanel.vue';
import ColorPicker, { PickerType } from '@/shared/components/ColorPicker.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { SelectOption } from '@/shared';
import { ChartUtils } from '@/utils';
import { cloneDeep, get } from 'lodash';
import { JsonUtils } from '@core/utils';
import RulePanel from '@/shared/settings/common/conditional-formatting/RulePanel.vue';
import FormatBySettingBar from '@/shared/settings/common/conditional-formatting/FormatBySettingBar.vue';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';

@Component({
  components: { FormatBySettingBar, RulePanel, ColorPicker, ColorScalePanel }
})
export default class ColorFormatSetting extends Vue {
  private readonly PickerType = PickerType;
  private readonly defaultColorFormattingOptions = FormattingOptions.DefaultFormattingOptions;
  private readonly ColorFormatType = ConditionalFormattingType;

  @Prop({ required: true })
  private readonly value?: ColorFormatting;

  @Prop({ required: true })
  private readonly functionType!: FunctionFormattingType;

  private colorFormatting: ColorFormatting;
  private summarizationOptions: SelectOption[] = [];
  private readonly defaultValue = {
    specificColor: '#d2f4ff'
  };

  @Ref()
  private readonly colorScalePanel?: ColorScalePanel;

  @Ref()
  private readonly rulePanel?: RulePanel;

  constructor() {
    super();
    this.colorFormatting = FormattingOptions.getDefaultColorFormatting();
  }

  private get selectedFieldId(): string {
    const field = this.colorFormatting.baseOnField;
    if (field) {
      return FormattingOptions.buildId(field);
    } else {
      return '';
    }
  }

  private get selectedDefaultColor() {
    return this.colorFormatting.scale?.default?.formattingType ?? DefaultValueFormattingType.AsZero;
  }

  private get isSpecificColor(): boolean {
    return this.selectedDefaultColor === DefaultValueFormattingType.SpecificColor;
  }

  private get databaseOptions(): DropdownData[] {
    return FormattingOptions.buildTableOptions(_BuilderTableSchemaStore.tableSchemas, column =>
      FormattingOptions.isShowColumn(column, this.colorFormatting.formatType)
    );
  }

  private get canSelectSummarization(): boolean {
    const isNonFunction = this.functionType === FunctionFormattingType.None;
    if (isNonFunction && this.colorFormatting.formatType === ConditionalFormattingType.FieldValue) {
      return false;
    } else if (isNonFunction) {
      return !ChartUtils.isNumberType(this.colorFormatting.baseOnField!.fieldType);
    } else {
      return true;
    }
  }

  private get isBaseFieldError(): boolean {
    if (this.colorFormatting.baseOnField) {
      switch (this.colorFormatting.formatType) {
        case ConditionalFormattingType.FieldValue:
          return !ChartUtils.isTextType(this.colorFormatting.baseOnField.fieldType);
        default:
          return false;
      }
    } else {
      return true;
    }
  }

  created() {
    this.initColorSetting();
  }

  validate(): boolean {
    if (this.isBaseFieldError) {
      return false;
    }

    switch (this.colorFormatting.formatType) {
      case ConditionalFormattingType.ColorScale:
        return this.colorScalePanel?.validate() ?? false;
      case ConditionalFormattingType.Rules:
        return this.rulePanel?.validate() ?? false;
      case ConditionalFormattingType.FieldValue:
        return true;
      default:
        return false;
    }
  }

  getColorFormatting(): ColorFormatting {
    const formatting = cloneDeep(this.colorFormatting);
    if (this.rulePanel) {
      formatting.rules!.colorRules = this.rulePanel.getRules();
    }
    return formatting;
  }

  private selectFormatBy(colorFormatType: ConditionalFormattingType) {
    this.handleFormatByChanged(colorFormatType, this.functionType, this.colorFormatting.formatType);
    this.colorFormatting.formatType = colorFormatType;
  }

  private selectApplyTo(type: ApplyToType) {
    this.colorFormatting.applyTo = type;
  }

  private selectDefaultColor(type: DefaultValueFormattingType) {
    this.colorFormatting.scale!.default!.formattingType = type;
  }

  private handleColorChanged(color: string): void {
    this.colorFormatting.scale!.default!.specificColor = color;
  }

  private selectBaseField(item: DropdownData): void {
    this.colorFormatting.baseOnField = item.field;
    this.summarizationOptions = FormattingOptions.getSummarizationOptions(this.colorFormatting.formatType, item.field);
    this.colorFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(this.colorFormatting.formatType, this.functionType, item.field);
  }

  private selectSummarization(type: FunctionType) {
    this.colorFormatting.summarization = type;
  }

  private initColorSetting() {
    this.initFormatting();
    const field: Field | null = this.getDefaultField();
    if (field) {
      this.$set(this.colorFormatting, 'baseOnField', field);
      this.setDefaultSummarization(field);
    }
  }

  private initFormatting() {
    if (this.value) {
      this.colorFormatting = JsonUtils.mergeDeep(FormattingOptions.getDefaultColorFormatting(), cloneDeep(this.value));
    }
  }

  private getDefaultField(): Field | null {
    if (this.value) {
      return this.value.baseOnField ?? this.getFirstField();
    } else {
      return this.getFirstField();
    }
  }

  private setDefaultSummarization(field: Field) {
    this.summarizationOptions = FormattingOptions.getSummarizationOptions(this.colorFormatting.formatType, field);
    const canSelectSummarization = !this.value || !this.value.baseOnField;
    if (canSelectSummarization) {
      this.colorFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(this.colorFormatting.formatType, this.functionType, field);
    }
  }

  private getFirstField(): Field | null {
    return get(this, 'databaseOptions[0].options[0].field', null);
  }

  private handleFormatByChanged(currentType: ConditionalFormattingType, functionType: FunctionFormattingType, oldType: ConditionalFormattingType) {
    const field: Field | undefined = this.colorFormatting.baseOnField;
    if (field) {
      this.summarizationOptions = FormattingOptions.getSummarizationOptions(currentType, field);
      this.colorFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(currentType, functionType, field);
    }
    const canPickBasedField = !ChartUtils.isTextType(field?.fieldType ?? '');
    if (currentType === ConditionalFormattingType.FieldValue && canPickBasedField) {
      this.$set(this.colorFormatting, 'baseOnField', this.getFirstField());
    }
  }
}
</script>

<style lang="scss" src="./ColorFormatSetting.scss"></style>
