<template>
  <EtlModal @submit="submit" @hidden="resetModel" ref="modal" :actionName="actionName" backdrop :width="640" title="Add Field" class="modal-mef">
    <div class="oblock">
      <div class="form-group" :class="{ 'is-invalid': displayNameError }">
        <label>Field name</label>
        <input
          :id="genInputId('column-name')"
          v-model.trim="displayName"
          @keydown.enter="submit"
          :class="{ 'is-invalid': displayNameError }"
          type="text"
          class="form-control"
          autofocus
          placeholder="Field name"
          ref="input"
        />
        <p class="invalid-feedback text-danger">{{ displayNameError }}</p>
      </div>
      <div class="form-group" :class="{ 'is-invalid': formulaError }">
        <label>Field expression</label>
        <div class="formula-completion-input" :class="{ 'is-invalid': formulaError }">
          <div class="padding-top"></div>
          <FormulaCompletionInput v-if="formulaController" v-model="formula" :formulaController="formulaController" />
        </div>
        <p class="invalid-feedback text-danger">{{ formulaError }}</p>
      </div>
    </div>
  </EtlModal>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue } from 'vue-property-decorator';
import EtlModal from '../../../etl-modal/EtlModal.vue';
import { ExpressionFieldConfiguration, FieldConfiguration, ManageFieldOperator } from '@core/data-cook';
import { TableSchema } from '@core/common/domain';
import { FormulaSuggestionModule } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { ExpressionParser, RawExpressionData } from '@core/schema/service/ExpressionParser';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';
import { Di } from '@core/common/modules';
import { FormulaControllerFactoryResolver } from '@/shared/fomula/builder/FormulaControllerFactoryResolver';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';

enum VIEW_MODE {
  Add = 'Add',
  Edit = 'Edit'
}

@Component({
  components: {
    EtlModal,
    FormulaCompletionInput
  }
})
export default class ManageExpressionField extends Vue {
  protected viewMode: VIEW_MODE = VIEW_MODE.Add;
  protected target: ExpressionFieldConfiguration | null = null;
  protected displayName = '';
  protected formula = '';
  protected formulaController: MonacoFormulaController | null = null;
  protected tableSchema: TableSchema | null = null;
  protected displayNameError = '';
  protected formulaError = '';

  @Ref()
  protected modal!: EtlModal;

  @Prop({ type: ManageFieldOperator, default: () => null })
  protected readonly data: ManageFieldOperator | null = null;

  protected get actionName() {
    if (this.viewMode === VIEW_MODE.Add) return 'Add';
    else return 'Save';
  }

  protected resetModel() {
    this.target = null;
    this.displayName = '';
    this.formula = '';
    this.formulaController = null;
    this.tableSchema = null;
    this.displayNameError = '';
    this.formulaError = '';
  }

  @Track(TrackEvents.ColumnCreateExpression, {
    database_name: (_: ManageExpressionField, args: any) => args[1].dbName,
    table_name: (_: ManageExpressionField, args: any) => args[1].name
  })
  add(tableSchema: TableSchema) {
    this.initFormulaSuggestion(tableSchema);
    this.tableSchema = tableSchema;
    this.viewMode = VIEW_MODE.Add;
    this.target = new ExpressionFieldConfiguration('', '', '', null, false);
    this.displayName = '';
    this.formula = '';
    // @ts-ignore
    this.modal?.show();
  }

  @Track(TrackEvents.ColumnEditExpression, {
    formula: (_: ManageExpressionField, args: any) => args[0].expression,
    column_name: (_: ManageExpressionField, args: any) => args[0].displayName,
    database_name: (_: ManageExpressionField, args: any) => args[1].dbName,
    table_name: (_: ManageExpressionField, args: any) => args[1].name
  })
  edit(field: ExpressionFieldConfiguration, tableSchema: TableSchema) {
    this.viewMode = VIEW_MODE.Edit;
    this.target = field;
    this.displayName = this.target.displayName;
    this.formula = this.target.expression;
    this.tableSchema = tableSchema;
    this.initFormulaSuggestion(tableSchema);
    // @ts-ignore
    this.modal?.show();
  }

  hide() {
    // @ts-ignore
    this.modal?.hide();
  }

  @Track(TrackEvents.ColumnSubmit, {
    formula: (_: ManageExpressionField, args: any) => _.formula,
    column_name: (_: ManageExpressionField, args: any) => _.displayName,
    database_name: (_: ManageExpressionField, args: any) => _.tableSchema?.dbName,
    table_name: (_: ManageExpressionField, args: any) => _.tableSchema?.name
  })
  submit() {
    if (this.target && this.tableSchema) {
      this.formulaError = '';
      this.displayNameError = '';
      let isInvalid = false;
      const expression = ExpressionParser.parse(new RawExpressionData(this.formula, this.tableSchema)).expr;
      if (!expression) {
        this.formulaError = `Please input field expression`;
        isInvalid = true;
      }
      if (!this.displayName) {
        this.displayNameError = `Please input field name`;
        (this.$refs.input as HTMLElement).focus();
        isInvalid = true;
      }
      if (this.data) {
        const fields: FieldConfiguration[] = (this.data.fields as FieldConfiguration[]).concat(this.data.extraFields.filter(f => f !== this.target));
        if (fields.find(f => f.displayName.toLowerCase() === this.displayName.toLowerCase())) {
          this.displayNameError = `Already exited field name`;
          (this.$refs.input as HTMLElement).focus();
          isInvalid = true;
        }
      }
      if (isInvalid) return;
      this.formulaError = '';
      this.displayNameError = '';
      this.target.displayName = this.displayName;
      // this.target.fieldName = this.displayName;
      // [this.displayName, new Date().getTime().toString(36)]
      //   .join(' ')
      //   .toLowerCase()
      //   .replace(/\s+/g, '_');
      this.target.expression = expression;
    }
    this.$emit('submit', this.target);
    this.hide();
  }

  protected initFormulaSuggestion(tableSchema: TableSchema) {
    const factory: FormulaControllerFactory = Di.get(FormulaControllerFactoryResolver).resolve(ConnectionModule.sourceType);
    FormulaSuggestionModule.loadSuggestions({
      supportedFunctionInfo: factory.getSupportedFunctionInfo(),
      ignoreFunctions: ['Keyword']
    });
    FormulaSuggestionModule.setTableSchema(tableSchema);
    this.formulaController = factory.createCalculatedFieldController(FormulaSuggestionModule.allFunctions, FormulaSuggestionModule.columns);
  }
}
</script>
<style lang="scss" scoped>
.modal-mef {
  .form-group {
    .formula-completion-input.is-invalid,
    .form-control.is-invalid {
      border: 1px solid red;
    }
  }

  ::v-deep .formula-completion-input {
    height: 200px;
    background-color: var(--primary);
    border-radius: 4px;

    .padding-top {
      height: 16px;
    }

    .monaco_editor_container {
      max-height: calc(100% - 16px);
    }
  }
}
</style>
