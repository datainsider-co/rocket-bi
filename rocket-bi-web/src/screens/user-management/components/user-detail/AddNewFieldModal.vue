<template>
  <DiCustomModal ref="customModal" ok-title="Add New Field" size="md" title="Add New Field" @onClickOk="handleClickOk">
    <div class="new-field-body d-flex flex-column align-items-center">
      <div class="input-box">
        <div class="title">Name</div>
        <BInput
          :id="genInputId('field-name')"
          v-model="newFieldData.fieldName"
          autocomplete="off"
          autofocus
          class="form-control"
          :class="{ danger: $v.newFieldData.fieldName.$error, 'border-0': !$v.newFieldData.fieldValue.$error }"
          placeholder="New attribute name"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.newFieldData.fieldName.$error">
          <div v-if="!$v.newFieldData.fieldName.required" class="text-warning">Field Name is required</div>
        </div>
      </div>

      <div class="input-box">
        <div class="title">Value</div>
        <BInput
          :id="genInputId('field-value')"
          v-model="newFieldData.fieldValue"
          trim
          autocomplete="off"
          class="form-control"
          :class="{ danger: $v.newFieldData.fieldValue.$error, 'border-0': !$v.newFieldData.fieldValue.$error }"
          placeholder="New attribute value"
          type="text"
          @keydown.enter="handleClickOk"
        />
        <div v-if="$v.newFieldData.fieldValue.$error">
          <div v-if="!$v.newFieldData.fieldValue.required" class="text-warning">Field Value is required</div>
        </div>
      </div>
      <div class="pt-3">
        <BSpinner v-if="isLoading" label="Spinning"></BSpinner>
        <pre v-if="isError" class="error-message">{{ errorMessage }}</pre>
      </div>
    </div>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { required } from 'vuelidate/lib/validators';
import { UserDetailModule } from '@/screens/user-management/store/UserDetailStore';
import { DIException } from '@core/common/domain/exception';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { EditUserPropertyRequest } from '@core/admin/domain/request/EditUserPropertyRequest';

export class CustomPropertyInfo {
  constructor(public fieldName: string, public fieldValue: string) {}
  static empty(): CustomPropertyInfo {
    return new CustomPropertyInfo('', '');
  }
}

@Component({
  components: {
    DiCustomModal
  },
  validations: {
    newFieldData: {
      fieldName: { required },
      fieldValue: { required }
    }
  }
})
export default class AddNewFieldModal extends Vue {
  private newFieldData: CustomPropertyInfo = CustomPropertyInfo.empty();
  errorMessage = '';
  private status = Status.Loaded;

  @Ref()
  private customModal!: DiCustomModal;

  get userFullDetailInfo() {
    return UserDetailModule.userFullDetailInfo;
  }

  show() {
    this.customModal.show();
    this.resetData();
  }

  hide() {
    this.customModal.hide();
    this.resetData();
  }

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private isAddNewField(): boolean {
    // TODO: validate here
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private handleClickOk(event: MouseEvent) {
    event.preventDefault();
    Log.debug('addNewFieldModal::handleClick::click');
    if (this.isAddNewField()) {
      // this.$emit('handleSubmitNewField', this.newFieldData);
      this.status = Status.Loading;
      this.handleSaveNewField(this.newFieldData).then(status => {
        if (status) {
          this.hide();
          TrackingUtils.track(TrackEvents.SubmitAddExtraUserInfo, {
            user_id: this.userFullDetailInfo?.profile?.username,
            user_email: this.userFullDetailInfo?.profile?.email,
            user_full_name: this.userFullDetailInfo?.profile?.fullName,
            field_name: this.newFieldData.fieldName,
            value: this.newFieldData.fieldValue
          });
        }
      });
    }
  }

  private handleSaveNewField(newFieldData: CustomPropertyInfo): Promise<boolean> {
    Log.debug('Contact::handleAddNewField::newFieldData::', newFieldData);
    const request: EditUserPropertyRequest = new EditUserPropertyRequest(
      this.userFullDetailInfo?.profile?.username!,
      {
        ...this.userFullDetailInfo?.profile?.properties,
        [newFieldData.fieldName]: newFieldData.fieldValue
      },
      []
    );
    return UserDetailModule.updateUserProperties(request)
      .then(() => {
        // PopupUtils.showSuccess(`${this.userFullDetailInfo?.profile?.fullName}'s profile is updated successfully.`);
        this.status = Status.Loaded;
        return true;
      })
      .catch(ex => {
        this.handleError(ex);
        this.status = Status.Error;
        return false;
      });
  }

  handleError(ex: DIException) {
    Log.debug('AddNewFieldModal::handleError::error', ex.message);
    this.errorMessage = ex.message;
  }

  private resetData() {
    this.newFieldData = CustomPropertyInfo.empty();
    this.errorMessage = '';
    this.$v.$reset();
    this.status = Status.Loaded;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/di-variables.scss';
@import '~@/themes/scss/mixin.scss';

.new-field-body {
  .danger {
    border: 1px solid var(--danger) !important;
  }

  pre {
    white-space: pre-wrap;
  }
  .input-box {
    padding: 0 24px;
    width: 100%;

    .title {
      @include regular-text;
      font-size: 12px;
      padding-bottom: 8px;
      opacity: 0.5;
    }

    > input {
      @include regular-text-14();
      padding: 10px 16px;
      height: 40px;
      cursor: text;
    }
    .text-warning {
      color: var(--danger) !important;
    }
  }

  .input-box + .input-box {
    margin-top: 16px;
  }

  .error-message {
    color: var(--danger);
    padding: 10px 24px;
  }
}
</style>
