<template>
  <DiCustomModal
    ref="customModal"
    :ok-disabled="!enableCreateButton"
    class="di-modal"
    ok-title="Create"
    size="md"
    title="Create table"
    @onClickOk="handleClickOk"
  >
    <div class="table-create-modal--body">
      <vuescroll :ops="ScrollOptions">
        <div class="create-lake-table-modal-container">
          <div class="form-group">
            <label>Name</label>
            <b-input
              :id="genInputId('table-name')"
              v-model="tableInfo.tableName"
              autofocus
              class="w-100"
              placeholder="Enter table name"
              tabindex="1"
              type="text"
              @keydown.enter="handleEnterName"
            />
            <div v-if="$v.tableInfo.tableName.$error" class="mt-2 text-danger">
              <div v-if="!$v.tableInfo.tableName.required">Field name is required.</div>
              <span v-else-if="!$v.tableInfo.tableName.maxLength">Max length is 250 chars.</span>
              <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <b-input
              :id="genInputId('table-description')"
              ref="desInput"
              v-model="tableInfo.description"
              class="w-100"
              placeholder="Enter table description"
              tabindex="2"
              type="text"
              @keydown.enter="handleClickOk"
            />
          </div>
          <div class="form-group">
            <label class="d-flex">
              <div class="mr-3">Access type</div>
              <BFormRadioGroup id="radio-group-2" v-model="tableInfo.accessType" name="radio-sub-component" plain disabled>
                <BFormRadio :value="privateAccessType">Private</BFormRadio>
                <BFormRadio :value="publicAccessType">Public</BFormRadio>
              </BFormRadioGroup>
            </label>
          </div>
          <div class="form-group mb-0">
            <label class="d-flex align-items-center">
              <div class="mr-3">Source</div>
              <div class="btn-icon btn-icon-border mr-0 add-source" @click="emitClickAddSource">
                <div class="btn-add-source">
                  <i class="di-icon-add" tabindex="4"></i>
                </div>
              </div>
            </label>
            <div class="selected-source">
              <template v-if="isEmptySelectedSource">
                <div class="source-empty">
                  <span>Empty</span>
                </div>
              </template>
              <template v-else>
                <template v-for="(source, index) in tableInfo.dataSource">
                  <div :key="index" class="source-item">
                    <BFormInput :value="source" class="source-name" placeholder="Source Empty" @input="updateSelectedSource(index, ...arguments)"></BFormInput>
                    <i class="di-icon-delete remove-source icon-button btn-icon-border" @click="handleRemoveSource(index)" />
                  </div>
                </template>
              </template>
            </div>
          </div>
        </div>
      </vuescroll>
      <b-collapse :visible="isError" class="d-flex align-items-center mt-2 mar-left-16 mr-3">
        <div class="error-message text-danger">
          {{ errorMessage }}
        </div>
      </b-collapse>
    </div>
    <template v-slot:modal-footer="{ ok, cancel }">
      <b-button class="flex-grow-1 flex-shrink-1 h-42px" variant="secondary" @click="cancel()">
        Cancel
      </b-button>
      <b-button :disabled="!enableCreateButton" class="flex-grow-1 flex-shrink-1 h-42px" variant="primary" @click="ok()">
        <div class="d-flex flex-row align-items-center justify-content-center">
          <DiLoading v-if="isLoading"></DiLoading>
          <template>
            <div v-if="isEditTable" class="pl-2">Update</div>
            <div v-else class="pl-2">Preview</div>
          </template>
        </div>
      </b-button>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Emit, Ref, Vue, Watch } from 'vue-property-decorator';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { Status, VerticalScrollConfigs } from '@/shared';
import { AccessType, PrepareCreateTableRequest, TableInfo, TableManagementService } from '@core/lake-house';
import { ListUtils } from '@/utils';
import { BButton, BFormInput } from 'bootstrap-vue';
import { StringUtils } from '@/utils/StringUtils';
import { Inject } from 'typescript-ioc';
import { Log } from '@core/utils';
import DiLoading from '@/shared/components/DiLoading.vue';
import { cloneDeep } from 'lodash';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

// eslint-disable-next-line no-useless-escape
const nameRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  components: { DiLoading, MessageContainer, DiCustomModal },
  validations: {
    tableInfo: {
      tableName: { required, nameRule, maxLength: maxLength(250) }
    }
  }
})
export default class TableCreationModal extends Vue {
  private readonly ScrollOptions = VerticalScrollConfigs;
  private status = Status.Loaded;
  private readonly privateAccessType = AccessType.Private;
  private readonly publicAccessType = AccessType.Public;
  private tableInfo: TableInfo = TableInfo.empty();
  private oldTableInfo: TableInfo | null = null;
  private errorMessage = '';
  @Inject
  private readonly tableService!: TableManagementService;

  @Ref()
  private readonly customModal?: DiCustomModal;

  @Ref()
  private readonly desInput?: BFormInput;

  @Ref()
  private readonly createButton?: BButton;

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  private get isEmptySelectedSource(): boolean {
    return ListUtils.isEmpty(this.tableInfo.dataSource);
  }

  private get enableCreateButton() {
    const notEmptyName = StringUtils.isNotEmpty(this.tableInfo.tableName);
    const notEmptySource = ListUtils.isNotEmpty(this.tableInfo.dataSource);
    return notEmptyName && notEmptySource && !this.isLoading;
  }

  private get isEditTable(): boolean {
    return !!this.oldTableInfo?.id;
  }

  @Track(TrackEvents.LakeSchemaSelectSources, { sources: (_: TableCreationModal, args: any) => args[0].join(',') })
  addSources(sources: string[]) {
    this.tableInfo.dataSource = sources;
  }

  @Track(TrackEvents.ShowCreateTableModal)
  create() {
    this.initModal();
    this.show();
  }

  @Track(TrackEvents.ShowEditTableModal, {
    table_name: (_: TableCreationModal, args: any) => (args[0] as TableInfo).tableName,
    table_id: (_: TableCreationModal, args: any) => (args[0] as TableInfo).id,
    table_sources: (_: TableCreationModal, args: any) => (args[0] as TableInfo).dataSource.join(',')
  })
  edit(table: TableInfo) {
    this.updateFromTableInfo(table);
    this.show();
  }

  hide() {
    this.$nextTick(() => {
      this.initModal();
      this.customModal?.hide();
    });
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showError(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.status = Status.Error;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }

  @AtomicAction()
  async handleClickOk(e: MouseEvent) {
    try {
      Log.debug('Staring create preview table.');
      e.preventDefault();
      if (this.validateModal()) {
        const newTableInfo = this.prepareTableInfo(this.tableInfo);
        const request: PrepareCreateTableRequest = this.buildCreateTableRequest(this.isEditTable, newTableInfo, this.oldTableInfo);
        this.showLoading();
        const response = await this.tableService.prepareCreateTable(request);
        newTableInfo.delimiter = response.delimiter ?? '';
        newTableInfo.tableName = request.tableName;
        this.showLoaded();
        Log.debug('Created table success');
        this.$emit('submit', { response: response, table: newTableInfo, isEdit: this.isEditTable });
        TrackingUtils.track(TrackEvents.LakeSchemaPreviewTable, { table_name: newTableInfo.tableName, sources: newTableInfo.dataSource.join(',') });
      }
    } catch (e) {
      Log.error('TableCreationModal::handleClickOk::error::', e);
      this.showError(e.message);
    }
  }

  validateModal() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  @Watch('tableName')
  onTableNameChanged() {
    this.$v.tableName.$reset();
  }

  private show() {
    this.$nextTick(() => {
      this.customModal?.show();
    });
  }

  private initModal() {
    this.tableInfo = TableInfo.empty();
    this.oldTableInfo = null;
    this.errorMessage = '';
    this.status = Status.Loaded;
    this.$v.$reset();
  }

  private updateFromTableInfo(table: TableInfo) {
    this.tableInfo = cloneDeep(table);
    this.oldTableInfo = cloneDeep(table);
  }

  private updateSelectedSource(index: number, value: string) {
    this.tableInfo.dataSource[index] = value;
  }

  @Track(TrackEvents.LakeSchemaRemoveSource, {
    source: (_: TableCreationModal, args: any) => _.tableInfo?.dataSource[args[0]]
  })
  private handleRemoveSource(index: number) {
    this.tableInfo.dataSource = ListUtils.removeAt(this.tableInfo.dataSource, index);
  }

  @Emit('clickAddSource')
  private emitClickAddSource() {
    return this.tableInfo.dataSource;
  }

  private handleEnterName() {
    this.desInput?.focus();
  }

  private buildCreateTableRequest(isEdit: boolean, tableInfo: TableInfo, oldTableInfo?: TableInfo | null): PrepareCreateTableRequest {
    const tableName = StringUtils.normalizeTableName(tableInfo.tableName);
    const request = new PrepareCreateTableRequest(tableName, tableInfo.dataSource);
    request.description = tableInfo.description;
    request.accessType = tableInfo.accessType;
    if (this.isEditTable) {
      request.oldName = StringUtils.normalizeTableName(oldTableInfo?.tableName ?? '');
    }
    return request;
  }

  private prepareTableInfo(tableInfo: TableInfo) {
    const newTableInfo = cloneDeep(tableInfo);
    newTableInfo.dataSource = newTableInfo.dataSource.filter(source => StringUtils.isNotEmpty(source));
    return newTableInfo;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.create-lake-table-modal-container {
  height: 350px;
  label {
    margin-bottom: 11px;
  }

  input {
    height: 40px;
    padding: 10px;
  }

  .add-source {
    opacity: 1;

    .btn-add-source {
      width: 16px;
      height: 16px;
      background: var(--accent);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      i {
        font-size: 10px;
        color: var(--primary);
      }
    }
  }

  .selected-source {
    border-radius: 4px;

    .placeholder {
      color: var(--text-color);
      @include regular-text-14();
      opacity: 0.3;
    }

    .source-empty {
      background: #fafafa;
      padding: 12px 16px;

      span {
        opacity: 0.3;
      }
    }

    .source-item {
      display: flex;
      background: #fafafa;
      align-items: center;
      justify-content: space-between;

      .source-name {
        background: #fafafa;
      }

      .remove-source {
        font-size: 16px;
        margin-right: 8px;
        margin-left: 8px;
      }
    }

    .source-item + .source-item {
      margin-top: 4px;
    }
  }

  .form-check {
    align-items: center;

    .form-check-input {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }

    .form-check-label {
      margin-bottom: 0;
    }
  }
}

.table-create-modal--body {
  .error-message {
    word-break: break-all;
  }
}
</style>
