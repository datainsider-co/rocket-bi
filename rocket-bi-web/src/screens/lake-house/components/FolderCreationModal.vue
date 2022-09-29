<template>
  <DiCustomModal class="di-modal" ref="customModal" size="md" title="New Directory" @onClickOk="handleClickOk">
    <div class="create-folder-modal-container">
      <div class="form-group">
        <label>Name</label>
        <b-input v-model="folderName" autofocus class="w-100" placeholder="Enter directory" type="text" @keydown.enter="handleClickOk" />
        <div class="mt-2 error-message" v-if="$v.folderName.$error">
          <div v-if="!$v.folderName.required">Field name is required.</div>
          <span v-else-if="!$v.folderName.maxLength">Max length is 250 chars.</span>
          <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
        </div>
      </div>
      <!--      <div class="form-group">-->
      <!--        <label>Group</label>-->
      <!--        <b-input v-model="groupName" class="w-100" placeholder="Typing group name" type="text" @keydown.enter="handleClickOk" />-->
      <!--        <div class="mt-2 error-message" v-if="$v.groupName.$error">-->
      <!--          <div v-if="!$v.groupName.required">Field group name is required.</div>-->
      <!--          <span v-else-if="!$v.groupName.maxLength">Max length is 250 chars.</span>-->
      <!--          <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>-->
      <!--        </div>-->
      <!--      </div>-->

      <div v-if="isError" class="mt-2 error-message">{{ errorMessage }}</div>
    </div>
    <template v-slot:modal-footer="{ cancel }">
      <b-button class="flex-fill h-42px" variant="secondary" @click="cancel()">
        Cancel
      </b-button>
      <b-button :disabled="isLoading" class="flex-fill h-42px" variant="primary" @click="handleClickOk">
        <i v-if="isLoading" class="fa fa-spin fa-spinner"></i>
        Create
      </b-button>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { DatabaseInfo } from '@core/common/domain/model';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import { DataManagementModule } from '@/screens/data-management/store/DataManagementStore';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { Status } from '@/shared';

// eslint-disable-next-line no-useless-escape
const nameRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  components: { MessageContainer, DiCustomModal },
  validations: {
    folderName: { required, nameRule, maxLength: maxLength(250) }
    // groupName: { required, nameRule, maxLength: maxLength(250) }
  }
})
export default class FolderCreationModal extends Vue {
  private folderName = '';
  private groupName = '';
  private status = Status.Loaded;
  private errorMessage = '';

  @Ref()
  private readonly customModal?: DiCustomModal;

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  show() {
    this.customModal?.show();
    this.reset();
  }
  hide() {
    this.customModal?.hide();
    this.reset();
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showError(errorMessage: string) {
    this.status = Status.Error;
    this.errorMessage = errorMessage;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }

  @AtomicAction()
  handleClickOk(e: MouseEvent) {
    e.preventDefault();
    if (this.validateModal()) {
      this.$emit('createDirectory', this.folderName, this.groupName);
    }
  }

  validateModal() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  reset() {
    this.folderName = '';
    this.errorMessage = '';
    this.status = Status.Loaded;
    this.$v.$reset();
  }

  @Watch('folderName')
  onChangeFolderName() {
    this.$v.folderName.$reset();
  }

  @Watch('groupName')
  onChangeGroupName() {
    this.$v.groupName.$reset();
  }
}
</script>

<style lang="scss">
.create-folder-modal-container {
  label {
    margin-bottom: 11px;
    color: var(--secondary-text-color);
  }
  input {
    height: 40px;
    padding: 10px;
  }

  .error-message {
    color: var(--danger);
    word-break: break-all;

    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
