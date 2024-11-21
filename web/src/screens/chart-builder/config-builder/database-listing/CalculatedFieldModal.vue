<template>
  <Modal
    id="calculated-field"
    :centered="false"
    :show-close="true"
    :show.sync="isModalShowing"
    class="modal-config"
    modalClasses="custom-modal"
    :hide-on-backdrop-click="false"
  >
    <span slot="header">
      <template v-if="isCreateMode">
        Create
      </template>
      <template v-else-if="isEditMode">
        Edit
      </template>
      <span class="header-title" v-if="isCalculatedField">Calculated Field</span>
      <span class="header-title" v-else>Measure</span>
    </span>
    <div class="d-flex flex-row">
      <div class="col-6 p-0">
        <div class="d-flex flex-row align-items-start">
          <div class="col p-0">
            <template>
              <input
                :id="genInputId('calculated-field-name')"
                ref="displayNameInput"
                v-model="displayName"
                autocomplete="off"
                class="form-control calculated-field-name"
                placeholder="Column name"
                type="text"
              />
            </template>
          </div>
        </div>
        <div class="mt-3">
          <div class="formula-input">
            <div class="padding-top"></div>
            <textarea v-if="isTestAccount" style="z-index: -1; position: absolute" id="calculated-field-formula" v-model="formula" />
            <FormulaCompletionInput
              class="flex-grow-1 flex-shrink-1"
              v-model="formula"
              :formulaController="formulaController"
              @onSelectKeyword="handleSelectKeyword"
            />
          </div>
          <template>
            <div class="footer">
              <div v-if="isLoading" class="loading-icon">
                <i class="fa fa-spin fa-spinner"></i>
              </div>
              <div v-else-if="$v.$error || hasError" class="error pl-1 float-left">
                <span v-if="!$v.displayName.required">Column name is required.</span>
                <span v-else-if="!$v.formula.required">Formula field is required.</span>
                <span v-else-if="hasError"> {{ messageError }}</span>
              </div>
              <div class="modal-footer button-bar">
                <template v-if="isEditMode">
                  <button class="btn-secondary" @click="hide">Cancel</button>
                  <template>
                    <button class="btn-primary" v-if="isCalculatedField" @click="editCalculatedField">Update</button>
                    <button class="btn-primary" v-else @click="editMeasurementField">Update</button>
                  </template>
                </template>
                <template v-else-if="isCreateMode">
                  <button class="btn-secondary" @click="hide">Cancel</button>
                  <template>
                    <button class="btn-primary" v-if="isCalculatedField" @click="createCalculatedField">Create</button>
                    <button class="btn-primary" v-else @click="createMeasurementField">Create</button>
                  </template>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="col-3 pr-0">
        <template>
          <div>
            <DiDropdown
              v-model="supportedFunctionSelected"
              :data="supportedFunctions"
              :appendAtRoot="true"
              boundary="window"
              label-props="displayName"
              value-props="data"
            ></DiDropdown>
          </div>
          <div class="syntax-options mt-3">
            <vuescroll>
              <div>
                <DataListing :records="listingFunctions" key-for-display="name" @onClick="showDescription" />
              </div>
            </vuescroll>
          </div>
        </template>
      </div>
      <div class="col-3 syntax-detail di-scroll-bar">
        <template v-if="currentFunction">
          <div class="title">
            <h3 class="mt-2">
              {{ currentFunction.title || currentFunction.name }}
            </h3>
          </div>
          <div class="mt-2 syntax-description">
            <h5 v-if="currentFunction.description">
              {{ currentFunction.description }}
            </h5>
            <h5 v-else><i>No information available</i></h5>
            <template v-if="currentFunction.example">
              <h4>Example:</h4>
              <code class="example">{{ currentFunction.example }}</code>
            </template>
          </div>
        </template>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Column, MaterializedExpression, TableSchema } from '@core/common/domain/model';
import { required } from 'vuelidate/lib/validators';
import { DIException } from '@core/common/domain/exception';
import { FormulaException } from '@core/common/domain/exception/FormulaException';
import { DatabaseSchemaModule } from '@/store/modules/data-builder/DatabaseSchemaStore';
import { ExpressionParser, RawExpressionData } from '@core/schema/service/ExpressionParser';
import { SelectOption } from '@/shared';
import DataListing from '@/screens/dashboard-detail/components/widget-container/charts/action-widget/DataListing.vue';
import { FormulaSuggestionModule, FunctionInfo } from '@/screens/chart-builder/config-builder/database-listing/FormulaSuggestionStore';
import FormulaCompletionInput from '@/shared/components/formula-completion-input/FormulaCompletionInput.vue';
import { Log } from '@core/utils';
import { MonacoFormulaController } from '@/shared/fomula/MonacoFormulaController';
import { CalculatedFieldController } from '@/shared/fomula/CalculatedFieldController';
import { CalculatedFieldModalMode, CreateFieldData, EditFieldData } from '@/screens/chart-builder/config-builder/database-listing/CalculatedFieldData';
import { AtomicAction } from '@core/common/misc';
import Modal from '@/shared/components/builder/Modal.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { StringUtils } from '@/utils';
import { MeasureController } from '@/shared/fomula/MeasureController';
import { DataManager } from '@core/common/services';
import { ConnectionModule } from '@/screens/organization-settings/stores/ConnectionStore';
import { ConnectorType } from '@core/connector-config';
import { Di } from '@core/common/modules';
import { FormulaControllerFactoryResolver } from '@/shared/fomula/builder/FormulaControllerFactoryResolver';
import { FormulaControllerFactory } from '@/shared/fomula/builder/FormulaControllerFactory';

@Component({
  components: {
    FormulaCompletionInput,
    DataListing,
    Modal
  },
  validations: {
    displayName: { required },
    formula: { required }
  }
})
export default class CalculatedFieldModal extends Vue {
  protected readonly ALL_SUPPORTED_FUNCTION = 'All';
  protected isModalShowing = false;
  protected tableSchema!: TableSchema;
  protected displayName = '';
  protected formula = '';
  protected editingColumn?: Column;
  protected isLoading = false;

  protected messageError = '';
  protected supportedFunctionSelected = this.ALL_SUPPORTED_FUNCTION;
  protected currentFunction: FunctionInfo | null = null;
  protected formulaController: MonacoFormulaController | null = null;

  protected mode = CalculatedFieldModalMode.Create;

  protected isCalculatedField = true;

  @Ref()
  protected readonly formulaInput?: HTMLInputElement;

  @Ref()
  protected readonly displayNameInput?: HTMLInputElement;

  protected get isEditMode(): boolean {
    return this.mode == CalculatedFieldModalMode.Edit;
  }

  protected get isCreateMode(): boolean {
    return this.mode == CalculatedFieldModalMode.Create;
  }

  protected get supportedFunctions(): SelectOption[] {
    const supportedFunctions = FormulaSuggestionModule.supportedFunctionNames
      .map((name, index) => {
        return { id: index, displayName: name, data: name };
      })
      .sort((a, b) => StringUtils.compare(a.displayName, b.displayName));
    const allFunctions = { id: -1, displayName: 'All', data: this.ALL_SUPPORTED_FUNCTION };
    return [allFunctions, ...supportedFunctions];
  }

  protected get listingFunctions(): FunctionInfo[] {
    if (this.supportedFunctionSelected === this.ALL_SUPPORTED_FUNCTION) {
      return FormulaSuggestionModule.allFunctions;
    } else {
      return FormulaSuggestionModule.getFunctions(this.supportedFunctionSelected);
    }
  }

  protected get hasError(): boolean {
    return !!this.messageError;
  }

  @Track(TrackEvents.CalculatedFieldCreate, {
    table_name: (_: CalculatedFieldModal, args: any) => args[0].name,
    database_name: (_: CalculatedFieldModal, args: any) => args[0].dbName
  })
  public showCreateModal(tableSchema: TableSchema, isCalculatedField = true): void {
    this.resetData();

    this.mode = CalculatedFieldModalMode.Create;
    this.tableSchema = tableSchema;
    this.isModalShowing = true;
    this.isCalculatedField = isCalculatedField;

    this.initSuggestion(tableSchema, isCalculatedField);
  }

  @Track(TrackEvents.CalculatedFieldUpdate, {
    table_name: (_: CalculatedFieldModal, args: any) => args[0].name,
    database_name: (_: CalculatedFieldModal, args: any) => args[0].dbName,
    column_name: (_: CalculatedFieldModal, args: any) => args[1].name
  })
  public showEditModal(tableSchema: TableSchema, column: Column, isCalculatedField = true): void {
    this.resetData();
    this.initFormula(tableSchema, column, isCalculatedField);

    this.mode = CalculatedFieldModalMode.Edit;
    this.tableSchema = tableSchema;
    this.isModalShowing = true;
    this.isCalculatedField = isCalculatedField;

    this.initSuggestion(tableSchema, isCalculatedField);
  }

  hide() {
    this.isModalShowing = false;
  }

  protected initFormula(tableSchema: TableSchema, column: Column, isCalculatedField: boolean) {
    if (isCalculatedField) {
      this.formula = this.parseFormula(tableSchema, column);
      this.displayName = column.displayName;
      this.editingColumn = column;
    } else {
      this.formula = column.defaultExpression?.expr ?? '';
      this.displayName = column.displayName;
      this.editingColumn = column;
    }
  }

  protected parseFormula(tableSchema: TableSchema, column: Column): string {
    try {
      const expression: string = column.defaultExpression?.expr ?? '';
      return ExpressionParser.bindDisplayNameOfSchema(tableSchema, expression);
    } catch (ex) {
      Log.error('CalculatedFieldModal::toFormula', ex);
      return column.defaultExpression?.expr ?? '';
    }
  }

  protected initSuggestion(tableSchema: TableSchema, isCalculatedField: boolean) {
    const factory: FormulaControllerFactory = Di.get(FormulaControllerFactoryResolver).resolve(ConnectionModule.sourceType);
    FormulaSuggestionModule.loadSuggestions({
      supportedFunctionInfo: factory.getSupportedFunctionInfo(),
      ignoreFunctions: this.isCalculatedField ? ['Keyword'] : []
    });
    FormulaSuggestionModule.setTableSchema(tableSchema);
    if (isCalculatedField) {
      this.formulaController = factory.createCalculatedFieldController(FormulaSuggestionModule.allFunctions, FormulaSuggestionModule.columns);
    } else {
      this.formulaController = factory.createMeasureFieldController(FormulaSuggestionModule.allFunctions, tableSchema);
    }

    this.$nextTick(() => {
      this.displayNameInput?.focus();
      this.currentFunction = this.listingFunctions[0];
    });
  }

  protected resetData(): void {
    this.displayName = '';
    this.editingColumn = void 0;
    this.formula = '';
    this.isLoading = false;
    this.messageError = '';
    this.$v.$reset();
  }

  protected isValidField(): boolean {
    this.$v.$touch();
    return !this.$v.$error;
  }

  @Track(TrackEvents.CalculatedFieldSubmitCreate, {
    column_display_name: (_: CalculatedFieldModal) => _.displayName,
    table_name: (_: CalculatedFieldModal) => _.tableSchema.name,
    database_name: (_: CalculatedFieldModal) => _.tableSchema.name,
    expression: (_: CalculatedFieldModal) => ExpressionParser.parse(new RawExpressionData(_.formula, _.tableSchema))
  })
  @AtomicAction()
  protected async createCalculatedField(): Promise<void> {
    Log.debug('createCalculatedField::');
    if (!this.isLoading && this.isValidField()) {
      try {
        this.showLoading(true);
        const createFieldData: CreateFieldData = {
          displayName: this.displayName,
          tableSchema: this.tableSchema,
          description: 'Calculated field',
          expression: ExpressionParser.parse(new RawExpressionData(this.formula, this.tableSchema))
        };

        await DatabaseSchemaModule.createCalculatedField(createFieldData);
        this.$emit('created', createFieldData.tableSchema);
        this.showLoading(false);
        this.hide();
      } catch (ex) {
        this.handleException(ex);
      }
    }
  }

  @Track(TrackEvents.CalculatedFieldSubmitUpdate, {
    column_name: (_: CalculatedFieldModal) => _.editingColumn,
    table_name: (_: CalculatedFieldModal) => _.tableSchema.name,
    column_display_name: (_: CalculatedFieldModal) => _.displayName,
    expression: (_: CalculatedFieldModal) => ExpressionParser.parse(new RawExpressionData(_.formula, _.tableSchema))
  })
  @AtomicAction()
  protected async editCalculatedField(): Promise<void> {
    if (!this.isLoading && this.isValidField() && this.editingColumn) {
      try {
        this.showLoading(true);
        const editFieldData: EditFieldData = {
          displayName: this.displayName,
          tableSchema: this.tableSchema,
          editingColumn: this.editingColumn,
          newExpression: ExpressionParser.parse(new RawExpressionData(this.formula, this.tableSchema))
        };

        const newTableSchema = await DatabaseSchemaModule.editCalculatedField(editFieldData);
        this.$emit('updated', newTableSchema);
        this.showLoading(false);
        this.hide();
      } catch (ex) {
        this.handleException(ex);
      }
    }
  }

  protected handleException(ex: any): void {
    this.showLoading(false);
    Log.debug('handleException::', ex);
    // be careful: instanceof not working!!
    if (FormulaException.isFormulaException(ex)) {
      this.showFormulaError(ex);
    } else {
      this.showNormalError(DIException.fromObject(ex));
    }
  }

  protected showFormulaError(ex: FormulaException) {
    this.messageError = ex.message;
  }

  protected showNormalError(ex: DIException) {
    this.messageError = ex.message ?? 'Something went wrong';
  }

  protected showDescription(functionInfo: FunctionInfo): void {
    this.currentFunction = functionInfo;
  }

  protected showLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }

  protected handleSelectKeyword(keyword: string): void {
    const isDiffFunction = this.currentFunction?.title !== keyword;
    if (isDiffFunction) {
      const functionInfo: FunctionInfo | undefined = FormulaSuggestionModule.getFunctionInfo(keyword);
      if (functionInfo) {
        this.showDescription(functionInfo);
      }
    }
  }

  @AtomicAction()
  protected async createMeasurementField(): Promise<void> {
    Log.debug('createMeasurementField::');
    if (!this.isLoading && this.isValidField()) {
      try {
        this.showLoading(true);
        const createFieldData: CreateFieldData = {
          displayName: this.displayName,
          tableSchema: this.tableSchema,
          description: 'Measurement Field',
          expression: new MaterializedExpression(this.formula)
        };

        await DatabaseSchemaModule.createMeasurementField(createFieldData);
        this.$emit('created', createFieldData.tableSchema);
        this.showLoading(false);
        this.hide();
      } catch (ex) {
        this.handleException(ex);
      }
    }
  }

  @AtomicAction()
  protected async editMeasurementField(): Promise<void> {
    if (!this.isLoading && this.isValidField() && this.editingColumn) {
      try {
        this.showLoading(true);
        const editFieldData: EditFieldData = {
          displayName: this.displayName,
          tableSchema: this.tableSchema,
          editingColumn: this.editingColumn,
          newExpression: new MaterializedExpression(this.formula)
        };

        const tableSchema = await DatabaseSchemaModule.editMeasurementField(editFieldData);
        const newColumn = tableSchema.columns.concat(tableSchema.expressionColumns).find(column => column.name === this.editingColumn?.name);
        this.$emit('updated', tableSchema, this.editingColumn, newColumn);
        this.showLoading(false);
        this.hide();
      } catch (ex) {
        this.handleException(ex);
      }
    }
  }

  protected get isTestAccount(): boolean {
    return DataManager.isTestAccount();
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

@import '~bootstrap/scss/bootstrap-grid';

::v-deep {
  @import '~@/themes/scss/custom-popover';

  .custom-modal {
    max-width: 1500px !important;
    width: 1500px !important;

    @media (max-width: 1199.98px) {
      max-width: 800px !important;
      width: 800px !important;
    }

    @media (min-width: 1200px) and (max-width: 1600px) {
      max-width: 1000px !important;
      width: 1000px !important;
    }

    //@media (min-width: 1024.1px) and (max-width: 1199.98px) {
    //  max-width: 800px !important;
    //  width: 800px !important;
    //}

    .modal-body {
      padding-top: 0px !important;

      > div {
        margin: 0;
      }

      .calculated-field-name {
        background: var(--input-background-color);

        &::placeholder {
          color: var(--text-color);
          opacity: var(--normal-opacity);
        }
      }
    }

    .formula-input {
      height: 434px;
      display: flex;
      flex-direction: column;
      background-color: var(--editor-color);
      // don't use overflow in here, cause suggestion popup will be hidden
      //overflow: hidden;

      .padding-top {
        background-color: var(--editor-color);
        height: 16px;
      }

      @media (max-width: 1199.98px) {
        height: 290px;
      }

      @media (min-width: 1200px) and (max-width: 1600px) {
        height: 350px;
      }
    }

    .footer {
      margin-top: 32px;

      .loading-icon {
        margin-top: 10px;
        display: inline-block;

        .fa-spinner {
          font-size: 16px;
          color: var(--icon-color);
        }
      }

      .error {
        margin-top: 10px;
      }

      .button-bar {
        float: right;
        padding: 0;
        width: 220px;
        @include regular-text-14();

        > button {
          margin: 0;
        }

        button + button {
          margin-left: 16px;
        }
      }
    }

    .syntax-options {
      background-color: var(--input-background-color);
      max-height: 510px;
      min-height: 510px;
      overflow: scroll;

      position: relative;

      @media (max-width: 1199.98px) {
        max-height: 350px;
        min-height: 350px;
      }

      @media (min-width: 1200px) and (max-width: 1600px) {
        height: 410px;
        min-height: 410px;
      }
    }

    .syntax-detail {
      max-height: 550px;
      overflow: auto;
      //overflow: hidden;

      @media (max-width: 1199.98px) {
        max-height: 390px;
      }

      @media (min-width: 1200px) and (max-width: 1600px) {
        height: 450px;
      }

      .title {
        //height: 40px;

        h3 {
          @include bold-text();
          font-size: 17px;
          text-align: left;
        }
      }

      .syntax-description {
        @include regular-text-14();

        h4 {
          font-size: 18px;
        }

        h5 {
          text-align: left;
          @include regular-text-14();
        }
      }
    }

    .select-container {
      height: 40px;
      margin-top: 0;
    }
  }

  .custom-b-popover {
    justify-content: center;
    position: relative;
    width: 90%;

    .suggestion-panel {
      max-height: 180px;
      overflow: scroll;
    }
  }
}
</style>
