<template>
  <DiCustomModal
    id="user-profile-editing-modal"
    ref="diCustomModal"
    class="user-profile-editing-modal"
    size="md"
    title="Edit Profile"
    @hidden="reset"
    @onClickOk="handleEditUserProfile($event, updatedUserProfile)"
  >
    <div v-if="updatedUserProfile" class="user-profile-editing-modal--container">
      <vuescroll :ops="verticalScrollConfig">
        <div class="user-profile-editing-modal--container--scroll-body">
          <div class="user-profile-editing-modal--container--form-control">
            <label>Full Name</label>
            <BFormInput v-model="updatedUserProfile.fullName" autocomplete="off" autofocus placeholder="Input full name" />
            <div v-if="$v.updatedUserProfile.fullName.$error" class="error mt-1 mb-1">Field full name is required.</div>
          </div>
          <!--          <div class="user-profile-editing-modal&#45;&#45;container&#45;&#45;form-control">-->
          <!--            <label>Avatar</label>-->
          <!--            <BFormInput autofocus placeholder="Input avatar link" autocomplete="off" v-model="updatedUserProfile.avatar" />-->
          <!--          </div>-->
          <div class="d-flex">
            <div class="user-profile-editing-modal--container--form-control w-50 mr-12px">
              <label>First Name</label>
              <BFormInput :id="genInputId('first-name')" v-model="updatedUserProfile.firstName" autocomplete="off" placeholder="Input first name" />
              <div v-if="$v.updatedUserProfile.firstName.$error" class="error mt-1 mb-1">Field first name is required.</div>
            </div>
            <div class="user-profile-editing-modal--container--form-control w-50">
              <label>Last Name</label>
              <BFormInput :id="genInputId('last-name')" v-model="updatedUserProfile.lastName" autocomplete="off" placeholder="Input last name" />
              <div v-if="$v.updatedUserProfile.lastName.$error" class="error mt-1 mb-1">Field last name is required.</div>
            </div>
          </div>
          <div class="d-flex">
            <div class="user-profile-editing-modal--container--form-control w-50 mr-12px">
              <label>Gender</label>
              <DiDropdown
                id="date-of-birth-dropdown"
                v-model="updatedUserProfile.gender"
                :appendAtRoot="true"
                :data="genderDropdownItems"
                boundary="window"
                label-props="displayName"
                value-props="value"
              />
            </div>
            <div class="user-profile-editing-modal--container--form-control w-50">
              <label>Date of Birth</label>
              <DiDatePicker :date.sync="dateOfBirth" placement="right"></DiDatePicker>
            </div>
          </div>
          <div class="d-flex">
            <div class="user-profile-editing-modal--container--form-control w-50 mr-12px">
              <label>Email</label>
              <BFormInput :id="genInputId('email')" v-model="updatedUserProfile.email" autocomplete="off" class="disabled" disabled placeholder="Input email" />
            </div>
            <div class="user-profile-editing-modal--container--form-control w-50">
              <label>Phone</label>
              <BFormInput :id="genInputId('phone-number')" v-model="updatedUserProfile.mobilePhone" autocomplete="off" placeholder="Input phone" />
            </div>
          </div>
          <template v-if="updatedUserProfile.properties">
            <template v-for="(property, index) in properties">
              <div :key="index" class="user-profile-editing-modal--container--form-control">
                <label>{{ toSnakeCase(property.keyDisplayName) }}</label>
                <BFormInput :id="genInputId(property.key)" v-model="property.value" autocomplete="off" placeholder="Property value" readonly />
                <!--                  @input="handleUpdateProperties(property)"-->
              </div>
            </template>
          </template>
        </div>
      </vuescroll>
      <div v-if="isError" class="error mt-2">{{ errorMessage }}</div>
    </div>
    <template v-slot:modal-footer="{ cancel, ok }">
      <div class="d-flex w-100 m-0 custom-footer">
        <DiButton border class="flex-fill h-42px mr-3" title="Cancel" variant="secondary" @click="cancel()"></DiButton>
        <DiButton :disabled="isLoading" class="flex-fill h-42px submit-button" primary @click="ok()">
          <div class="d-flex flex-shrink-1 align-items-center">
            <i v-if="isLoading" class="fa fa-spin fa-spinner"></i>
            <div>
              Update
            </div>
          </div>
        </DiButton>
      </div>
    </template>
  </DiCustomModal>
</template>
<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Status, VerticalScrollConfigs } from '@/shared';
import { UserGenders, UserProfile } from '@core/common/domain';
import { StringUtils } from '@/utils/StringUtils';
import { Log } from '@core/utils';
import { cloneDeep } from 'lodash';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';
import { PopupUtils } from '@/utils/PopupUtils';
import { DataManager, UserProfileService } from '@core/common/services';
import { required } from 'vuelidate/lib/validators';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import DiDropdown from '@/shared/components/common/di-dropdown/DiDropdown.vue';
import { DropdownData } from '@/shared/components/common/di-dropdown';
import { Inject } from 'typescript-ioc';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { TrackingUtils } from '@core/tracking/TrackingUtils';

@Component({
  components: { DiDropdown, DiDatePicker, DiCustomModal },
  validations: {
    updatedUserProfile: {
      fullName: { required },
      lastName: { required },
      firstName: { required },
      email: { required }
    }
  }
})
export default class UserProfileEditingModal extends Vue {
  @Prop({ required: true })
  userProfile!: UserProfile;
  private readonly verticalScrollConfig = VerticalScrollConfigs;
  private status: Status = Status.Loaded;
  private errorMessage = '';
  private readonly genderDropdownItems: DropdownData[] = [
    {
      displayName: 'Male',
      value: UserGenders.Male
    },
    {
      displayName: 'Female',
      value: UserGenders.Female
    },
    {
      displayName: 'Other',
      value: UserGenders.Other
    }
  ];
  @Inject
  private readonly userProfileService!: UserProfileService;
  private updatedUserProfile: UserProfile = cloneDeep(this.userProfile);
  private dateOfBirth: Date = new Date();

  @Ref()
  private readonly diCustomModal!: DiCustomModal;

  get properties(): any[] {
    const result: any[] = [];
    if (this.userProfile.properties) {
      for (const property in this.userProfile.properties) {
        result.push({
          keyDisplayName: property,
          key: property,
          value: this.userProfile.properties[property]
        });
      }
    }
    return result;
  }

  private toSnakeCase(text: string) {
    return StringUtils.toSnakeCase(text);
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isError() {
    return this.status === Status.Error;
  }

  @Watch('dateOfBirth')
  onBirthDateChange(newDate: Date) {
    if (newDate) {
      this.updatedUserProfile.dob = newDate.getTime();
      Log.debug('DateOfBirth::', this.updatedUserProfile.dob);
    }
  }

  show() {
    this.updatedUserProfile = cloneDeep(this.userProfile);
    this.dateOfBirth = this.updatedUserProfile.dob ? new Date(this.updatedUserProfile.dob) : new Date();
    this.diCustomModal.show();
  }

  hide() {
    this.diCustomModal.hide();
  }

  showLoading() {
    this.status = Status.Loading;
  }

  showLoaded() {
    this.status = Status.Loaded;
  }

  showError(message: string) {
    this.status = Status.Error;
    this.errorMessage = message;
    PopupUtils.showError(message);
  }

  private handleUpdateProperties(property: any) {
    try {
      if (this.updatedUserProfile.properties) {
        this.updatedUserProfile.properties[property.key as string] = property.value;
        Log.debug('userProfileClone::updatedUserProfile::', this.updatedUserProfile);
      }
    } catch (e) {
      Log.error('UserProfileEditingModal::handleUpdateProperties::error::', e.message);
    }
  }

  private reset() {
    this.status = Status.Loaded;
    this.errorMessage = '';
    this.$v.$reset();
  }

  private validUserProfile() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  private async handleEditUserProfile(event: MouseEvent, userProfile: UserProfile) {
    try {
      event.preventDefault();
      if (this.validUserProfile()) {
        this.showLoading();
        const request = this.toEditUserProfileRequest(userProfile);
        Log.debug('profile request', request);
        const updatedProfile = await this.editUserProfile(request);
        Log.debug('profile updated', updatedProfile);
        this.updateUserProfile(updatedProfile);
        this.hide();
        this.$emit('updated', userProfile);
        TrackingUtils.track(TrackEvents.SubmitEditMyProfile, {
          user_id: userProfile.username,
          user_email: userProfile.email,
          updated_profile: JSON.stringify(updatedProfile)
        });
      }
    } catch (e) {
      this.showError(e.message);
    }
  }

  private toEditUserProfileRequest(userProfile: UserProfile): EditUserProfileRequest {
    return EditUserProfileRequest.create(userProfile.username, {
      ...userProfile
    });
  }

  private editUserProfile(request: EditUserProfileRequest): Promise<UserProfile> {
    return this.userProfileService.updateUserProfile(request);
  }

  private updateUserProfile(userProfile: UserProfile) {
    DataManager.saveUserProfile(userProfile);
  }
}
</script>

<style lang="scss">
#user-profile-editing-modal {
  .custom-header .modal-title {
    font-weight: normal;
    line-height: 28px;
  }

  .modal-body {
    padding: 16px 6px 8px 24px;
  }

  .modal-header {
    padding-left: 24px !important;
  }

  .custom-footer {
    padding: 4px 12px;
  }

  .submit-button {
    max-width: 218.3px;
    display: flex;
    align-items: center;
    justify-content: center;

    .title {
      display: none;
    }

    > div {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;

      i {
        margin-right: 8px;
      }
    }
  }
}

.user-profile-editing-modal {
  &--container {
    &--scroll-body {
      max-height: 300px;
      padding-right: 18px;
    }

    .mr-12px {
      margin-right: 12px;
    }

    &--form-control {
      margin-bottom: 12px;

      label {
        margin-bottom: 11px;
      }

      input {
        height: 40px;
        padding: 0 16px;

        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;

        &:disabled {
          background: var(--input-background-color);
        }
      }

      #date.input-calendar {
        width: calc(100% - 16px);
        padding-left: 16px;
      }

      .select-container {
        margin: 0;
      }

      #date-of-birth-dropdown {
        height: 40px;
      }
    }
  }
}
</style>
