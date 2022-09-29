<template>
  <div class="icon-format-setting">
    <FormatBySettingBar
      id="icon"
      :applyTo="iconFormatting.applyTo"
      :formatType="iconFormatting.formatType"
      displayType="icon"
      @onSelectApplyTo="selectApplyTo"
      @onSelectFormatBy="selectFormatBy"
    />
    <header class="setting-bar">
      <DropdownSetting
        id="icon-based-on-field"
        :class="{ 'base-field-error': isBaseFieldError }"
        :options="databaseOptions"
        :value="selectedFieldId"
        label="Based on field"
        @onSelected="selectBaseField"
      />
      <template v-if="canSelectSummarization">
        <DropdownSetting
          id="icon-summarization"
          :options="summarizationOptions"
          :value="iconFormatting.summarization"
          label="Summarization"
          @onChanged="selectSummarization"
        />
      </template>
      <template v-else>
        <div></div>
      </template>
      <div></div>
    </header>

    <header class="setting-bar">
      <DropdownSetting id="icon-layout" :options="iconLayoutOptions" :value="iconFormatting.layout" label="Icon layout" @onChanged="selectLayout" />
      <DropdownSetting id="icon-align" :options="iconAlignmentOptions" :value="iconFormatting.align" label="Icon alignment" @onChanged="selectAlignment" />
      <template v-if="canShowStyleSelection">
        <DropdownSetting
          id="icon-style"
          :options="iconStyleOptions"
          :value="iconFormatting.style"
          boundary="viewport"
          label="Style"
          @onSelected="selectStyle"
        />
      </template>
      <template v-else>
        <div></div>
      </template>
    </header>

    <div>
      <template v-if="iconFormatting.formatType === FormatType.Rules">
        <RulePanel ref="rulePanel" :rules="iconFormatting.rules.iconRules" rule-value-type="icon" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import { ApplyToType, ConditionalFormattingType, Field, FunctionType, IconAlign, IconFormatting, IconLayout, IconStyle } from '@core/common/domain';
import { FormattingOptions, FunctionFormattingType } from '@/shared/settings/common/conditional-formatting/FormattingOptions';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { SelectOption } from '@/shared';
import { ChartUtils, ListUtils } from '@/utils';
import { cloneDeep, get } from 'lodash';
import { JsonUtils } from '@core/utils';
import FormatBySettingBar from '@/shared/settings/common/conditional-formatting/FormatBySettingBar.vue';
import RulePanel from '@/shared/settings/common/conditional-formatting/RulePanel.vue';
import { _BuilderTableSchemaStore } from '@/store/modules/data-builder/BuilderTableSchemaStore';

@Component({
  components: { RulePanel, FormatBySettingBar }
})
export default class IconFormatSetting extends Vue {
  private readonly iconLayoutOptions = FormattingOptions.IconLayoutOptions;
  private readonly iconAlignmentOptions = FormattingOptions.IconAlignmentOptions;
  private readonly iconStyleOptions = FormattingOptions.IconOptions;
  private readonly FormatType = ConditionalFormattingType;
  @Prop({ required: true })
  private readonly value!: IconFormatting;

  @Prop({ required: true })
  private readonly functionType!: FunctionFormattingType;

  @Ref()
  private readonly rulePanel?: RulePanel;
  private iconFormatting: IconFormatting;
  private summarizationOptions: SelectOption[] = [];

  constructor() {
    super();
    this.iconFormatting = FormattingOptions.getDefaultIconFormatting();
  }

  private get canShowStyleSelection() {
    return this.iconFormatting.formatType === ConditionalFormattingType.Rules;
  }

  private get selectedFieldId(): string {
    const field = this.iconFormatting.baseOnField;
    if (field) {
      return FormattingOptions.buildId(field);
    } else {
      return '';
    }
  }

  private get databaseOptions(): DropdownData[] {
    return FormattingOptions.buildTableOptions(_BuilderTableSchemaStore.tableSchemas, column =>
      FormattingOptions.isShowColumn(column, this.iconFormatting.formatType)
    );
  }

  private get canSelectSummarization(): boolean {
    const isNonFunction = this.functionType === FunctionFormattingType.None;
    if (isNonFunction && this.iconFormatting.formatType === ConditionalFormattingType.FieldValue) {
      return false;
    } else if (isNonFunction) {
      return !ChartUtils.isNumberType(this.iconFormatting.baseOnField!.fieldType);
    } else {
      return true;
    }
  }

  private get isBaseFieldError(): boolean {
    if (this.iconFormatting.baseOnField) {
      switch (this.iconFormatting.formatType) {
        case ConditionalFormattingType.FieldValue:
          return !ChartUtils.isTextType(this.iconFormatting.baseOnField.fieldType);
        default:
          return false;
      }
    } else {
      return true;
    }
  }

  created() {
    this.initIconSetting();
  }

  validate(): boolean {
    if (this.isBaseFieldError) {
      return false;
    }

    switch (this.iconFormatting.formatType) {
      case ConditionalFormattingType.Rules:
        return this.rulePanel?.validate() ?? false;
      case ConditionalFormattingType.FieldValue:
        return true;
      default:
        return false;
    }
  }

  getIconFormatting(): IconFormatting {
    const formatting = cloneDeep(this.iconFormatting);
    if (this.rulePanel) {
      formatting.rules!.iconRules = this.rulePanel.getRules();
    }
    return formatting;
  }

  private selectFormatBy(formattingType: ConditionalFormattingType) {
    this.handleFormatByChanged(formattingType, this.functionType, this.iconFormatting.formatType);
    this.iconFormatting.formatType = formattingType;
  }

  private selectLayout(layout: IconLayout) {
    this.iconFormatting.layout = layout;
  }

  private selectAlignment(align: IconAlign) {
    this.iconFormatting.align = align;
  }

  private selectApplyTo(type: ApplyToType) {
    this.iconFormatting.applyTo = type;
  }

  private selectBaseField(item: DropdownData): void {
    this.iconFormatting.baseOnField = item.field;
    this.summarizationOptions = FormattingOptions.getSummarizationOptions(this.iconFormatting.formatType, item.field);
    this.iconFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(this.iconFormatting.formatType, this.functionType, item.field);
  }

  private selectSummarization(type: FunctionType) {
    this.iconFormatting.summarization = type;
  }

  private initIconSetting() {
    this.initFormatting();
    const field: Field | null = this.getDefaultField();
    if (field) {
      this.$set(this.iconFormatting, 'baseOnField', field);
      this.setDefaultSummarization(field);
    }
  }

  private initFormatting() {
    if (this.value) {
      this.iconFormatting = JsonUtils.mergeDeep(FormattingOptions.getDefaultIconFormatting(), cloneDeep(this.value));
    }
    const canSetDefaultIconRules = !this.value.rules || ListUtils.isEmpty(this.value.rules.iconRules);
    if (canSetDefaultIconRules) {
      this.iconFormatting.rules!.iconRules = cloneDeep(this.iconStyleOptions[0].data);
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
    this.summarizationOptions = FormattingOptions.getSummarizationOptions(this.iconFormatting.formatType, field);
    const canSelectSummarization = !this.value || !this.value.baseOnField;

    if (canSelectSummarization) {
      this.iconFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(this.iconFormatting.formatType, this.functionType, field);
    }
  }

  private getFirstField(): Field | null {
    return get(this, 'databaseOptions[0].options[0].field') ?? null;
  }

  private handleFormatByChanged(currentType: ConditionalFormattingType, functionType: FunctionFormattingType, oldType: ConditionalFormattingType) {
    const field: Field | undefined = this.iconFormatting.baseOnField;
    if (field) {
      this.summarizationOptions = FormattingOptions.getSummarizationOptions(currentType, field);
      this.iconFormatting.summarization = FormattingOptions.getDefaultSelectedSummarization(currentType, functionType, field);
    }
    const canPickBasedField = !ChartUtils.isTextType(field?.fieldType ?? '');
    if (currentType === ConditionalFormattingType.FieldValue && canPickBasedField) {
      this.$set(this.iconFormatting, 'baseOnField', this.getFirstField());
    }
  }

  private selectStyle(option: SelectOption): void {
    this.iconFormatting.style = option.id as IconStyle;
    if (this.rulePanel) {
      this.rulePanel.setRules(option.data ?? []);
    }
  }
}
</script>

<style lang="scss" src="./IconFormatSetting.scss"></style>
