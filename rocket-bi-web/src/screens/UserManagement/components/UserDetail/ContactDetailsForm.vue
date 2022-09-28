<template>
  <div class="scroll-area" :class="{ blockScroll: isClickGender }">
    <div class="profile-details-form">
      <EditableColumnFormInput
        :item="fixedColumn[0]"
        :backgroundColor="currentTheme.transparent"
        :inputBackgroundColor="currentTheme.activeColor"
        @editableFormInputSaved="handleUpdateContactInfo"
        :maxSpanWidth="maxSpanWidth"
      />
      <div class="email editable-form-input">
        <label class="editable-form-input-label">Email</label>
        <div class="value editable-form-input-input">{{ userFullDetailInfo.profile.email }}</div>
      </div>
      <EditableColumnFormInput
        :item="fixedColumn[2]"
        :backgroundColor="currentTheme.transparent"
        :inputBackgroundColor="currentTheme.activeColor"
        @editableFormInputSaved="handleUpdateContactInfo"
        :maxSpanWidth="maxSpanWidth"
      />

      <EditableColumnFormInput
        :item="fixedColumn[3]"
        :backgroundColor="currentTheme.transparent"
        :inputBackgroundColor="currentTheme.activeColor"
        @editableFormInputSaved="handleUpdateContactInfo"
        :maxSpanWidth="maxSpanWidth"
      />

      <div class="gender editable-form-input">
        <label class="editable-form-input-label">Gender</label>
        <DiDropdown
          :id="genDropdownId('user-profile-gender')"
          :appendAtRoot="true"
          :data="genderData"
          class="swm-select editable-form-input-input"
          v-model="currentGender"
          value-props="value"
        />
      </div>
      <div class="date-of-birth editable-form-input">
        <label class="editable-form-input-label">Date of Birth</label>
        <DiDatePicker :date.sync="dob" @input="handleChangeDateOfBirth" class="date-picker editable-form-input-input pr-2"> </DiDatePicker>
      </div>
      <EditableColumnFormInput
        :item="fixedColumn[4]"
        :backgroundColor="currentTheme.transparent"
        :inputBackgroundColor="currentTheme.activeColor"
        @editableFormInputSaved="handleUpdateContactInfo"
        :maxSpanWidth="maxSpanWidth"
      />

      <EditableColumnFormInput
        :item="fixedColumn[7]"
        :backgroundColor="currentTheme.transparent"
        :inputBackgroundColor="currentTheme.activeColor"
        @editableFormInputSaved="handleUpdateContactInfo"
        :maxSpanWidth="maxSpanWidth"
      />

      <template v-if="dynamicColumns.length > 0">
        <div class="attribute-label">
          <div class="title">ATTRIBUTES</div>
          <!--        <DiIconTextButton class="ml-auto" :id="genBtnId('add-new-field')" title="Add field" @click="handleAddNewField">-->
          <!--          <i class="di-icon-add"></i>-->
          <!--        </DiIconTextButton>-->
        </div>
        <div v-for="(item, index) in dynamicColumns" :key="index" class="user-property">
          <EditableColumnFormInput
            :item="item"
            :backgroundColor="currentTheme.transparent"
            :inputBackgroundColor="currentTheme.activeColor"
            @editableFormInputSaved="handleUpdateExtraInfo"
            :maxSpanWidth="maxSpanWidth"
            class="properties"
          />
          <i class="di-icon-delete btn-icon btn-icon-border p-0" @click="showDeletePropertyConfirmation(item)"></i>
        </div>
      </template>
      <!--      </template>-->
    </div>
    <!--    <AddNewFieldModal ref="addNewFieldModal"></AddNewFieldModal>-->
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import vuescroll from 'vuescroll';
import EditableColumnFormInput from '@/shared/components/EditableColumnFormInput.vue';
import { GenericColumn } from '@core/domain/Model/Column/Implement/GenericColumn';
import { EditableColumn } from '@core/domain/Model/Column/Implement/EditableColumn';
import { StringUtils } from '@/utils/string.utils';
import { UserDetailModule } from '@/screens/UserManagement/store/UserDetailStore';
import { UserGenders } from '@core/domain/Model';
// @ts-ignore
import DatePicker from 'v-calendar/lib/components/date-picker.umd';
import moment from 'moment';
import { EditUserProfileRequest } from '@core/admin/domain/request/EditUserProfileRequest';
import { PopupUtils } from '@/utils/popup.utils';
import { Log } from '@core/utils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import DiDatePicker from '@/shared/components/DiDatePicker.vue';
import { EditUserPropertyRequest } from '@core/admin/domain/request/EditUserPropertyRequest';
import AddNewFieldModal from '@/screens/UserManagement/components/UserDetail/AddNewFieldModal.vue';
import { Track } from '@/shared/anotation';
import { Modals } from '@/utils/modals';

@Component({
  components: {
    DiDatePicker,
    EditableColumnFormInput,
    vuescroll,
    DatePicker
    // AddNewFieldModal
  },
  computed: {}
})
export default class ContactDetailsForm extends Vue {
  private currentGender!: number | undefined;
  private dob!: Date | null;
  private modelDate!: Date | undefined;
  attrs: Array<object> = [
    {
      key: 'today',
      bar: 'blue',
      popover: {
        label: "You just hovered over today's date!"
      },
      dates: new Date()
    }
  ];

  @Prop({ type: Number })
  maxSpanWidth!: number;

  // @Ref()
  // private readonly addNewFieldModal!: AddNewFieldModal;

  isClickGender = false;

  constructor() {
    super();
    this.currentGender = this.userFullDetailInfo?.profile?.gender;
    this.dob = this.userFullDetailInfo?.profile?.dob ? moment(this.userFullDetailInfo?.profile?.dob).toDate() : null;
    // this.modelDate = this.dob;
  }

  //todo resolve lock scroll
  // private configOps: Config = DefaultScrollConfig;

  // private get dateOfBirth() {
  //   return  this.userFullDetailInfo?.profile?.dob? moment(this.userFullDetailInfo?.profile?.dob).toDate() : '---';
  // }
  //
  // private set dateOfBirth(date: Date) {
  //   this.dob = date;
  // }

  private get genderData() {
    return UserGenders.allGenders().map(genderItem => {
      return {
        label: genderItem[0],
        value: genderItem[1]
      };
    });
  }

  private get userFullDetailInfo() {
    return UserDetailModule.userFullDetailInfo;
  }

  private get fixedColumn(): EditableColumn[] {
    const result: EditableColumn[] = [];

    // get EditableColumn at profile
    this.columns.forEach(col => {
      const value = (this.userFullDetailInfo?.profile as any)[col.name];
      Log.debug(this.userFullDetailInfo?.profile);
      Log.debug('value::', value, col.name);
      result.push(new EditableColumn(col, value));
    });
    return result;
  }

  private get dynamicColumns(): EditableColumn[] {
    const result: EditableColumn[] = [];
    // get EditableColumn at profile.properties
    this.propertiesColumns.map(col => {
      const value = (this.userFullDetailInfo?.profile?.properties as any)[col.name];
      result.push(new EditableColumn(col, value));
    });

    return result;
  }

  //todo build profile -> generic column[]
  get columns(): GenericColumn[] {
    const result = [
      new GenericColumn({
        displayName: 'Name',
        name: 'fullName',
        dataType: 'string',
        className: ''
      }),
      new GenericColumn({
        displayName: 'Email',
        name: 'email',
        dataType: 'string',
        className: ''
      }),
      new GenericColumn({
        displayName: 'First Name',
        name: 'firstName',
        dataType: 'string',
        className: ''
      }),
      new GenericColumn({
        displayName: 'Last Name',
        name: 'lastName',
        dataType: 'string',
        className: ''
      }),
      new GenericColumn({
        displayName: 'Mobile Phone',
        name: 'mobilePhone',
        dataType: 'string',
        className: ''
      }),
      new GenericColumn({
        displayName: 'Gender',
        name: 'gender',
        dataType: 'number',
        className: ''
      }),

      new GenericColumn({
        displayName: 'Date of Birth',
        name: 'dob',
        dataType: 'number',
        className: ''
      }),
      new GenericColumn({
        displayName: 'Avatar',
        name: 'avatar',
        dataType: 'string',
        className: ''
      })
    ];
    return result;
  }

  get propertiesColumns(): GenericColumn[] {
    //Todo properties -> GenericColumn[]
    const result: GenericColumn[] = [];
    if (this.userFullDetailInfo?.profile) {
      for (const key in this.userFullDetailInfo.profile.properties) {
        result.push(
          new GenericColumn({
            displayName: StringUtils.toSnakeCase(key),
            name: key,
            dataType: 'string',
            className: ''
          })
        );
      }
    }
    return result;
  }

  get currentTheme() {
    return {
      transparent: '#00000000',
      activeColor: '#597FFF0D'
    };
  }

  handleChangeDateOfBirth(newDate: Date) {
    Log.debug('new Date::', newDate);
    const request: EditUserProfileRequest = EditUserProfileRequest.create(this.userFullDetailInfo?.profile?.username!, {
      dob: newDate.getTime()
    });
    UserDetailModule.editUserProfile(request)
      .then(() => {
        PopupUtils.showSuccess(`${this.userFullDetailInfo?.profile?.fullName}'s profile is updated successfully.`);
      })
      .catch(ex => {
        Log.debug('UserProfileDetailStore::editUserProfile::error::', ex.message);
        PopupUtils.showError(ex.message);
      });
  }

  @Watch('currentGender')
  handleEditGender(genderValue: number) {
    Log.debug('Gender:', genderValue);
    const request: EditUserProfileRequest = EditUserProfileRequest.create(this.userFullDetailInfo?.profile?.username!, {
      gender: genderValue
    });
    UserDetailModule.editUserProfile(request)
      .then(() => {
        PopupUtils.showSuccess(`${this.userFullDetailInfo?.profile?.fullName}'s profile is updated successfully.`);
      })
      .catch(ex => {
        Log.debug('UserProfileDetailStore::editUserProfile::error::', ex.message);
        PopupUtils.showError(ex.message);
      });
  }

  @Watch('dob')
  onDateOfBirthChange(date: Date) {
    this.handleChangeDateOfBirth(date);
  }

  //Todo edit contact info
  private handleUpdateContactInfo(newInfo: EditableColumn) {
    const request: EditUserProfileRequest = EditUserProfileRequest.create(this.userFullDetailInfo?.profile?.username!, {
      [newInfo.column.name]: newInfo.value
    });
    UserDetailModule.editUserProfile(request)
      .then(() => {
        // PopupUtils.showSuccess(`${this.userFullDetailInfo?.profile?.fullName}'s profile is updated successfully.`);
        TrackingUtils.track(TrackEvents.UpdateUserInfo, {
          user_id: UserDetailModule.userFullDetailInfo?.profile?.username,
          user_email: UserDetailModule.userFullDetailInfo?.profile?.email,
          field: newInfo.column.name,
          value: newInfo.value
        });
      })
      .catch(ex => {
        Log.debug('UserProfileDetailStore::editUserProfile::error::', ex.message);
        PopupUtils.showError(ex.message);
      });
  }

  private handleUpdateExtraInfo(newExtraInfo: EditableColumn) {
    const request: EditUserPropertyRequest = new EditUserPropertyRequest(
      this.userFullDetailInfo?.profile?.username!,
      {
        ...(this.userFullDetailInfo?.profile?.properties ?? {}),
        [newExtraInfo.column.name]: newExtraInfo.value
      },
      []
    );

    Log.debug('updateContactInfo::editableProfileColumn::request', request);
    UserDetailModule.updateUserProperties(request)
      .then(() => {
        // PopupUtils.showSuccess(`${this.userFullDetailInfo?.profile?.fullName}'s profile is updated successfully.`);
        TrackingUtils.track(TrackEvents.UpdateUserInfo, {
          user_id: UserDetailModule.userFullDetailInfo?.profile?.username,
          user_email: UserDetailModule.userFullDetailInfo?.profile?.email,
          field: newExtraInfo.column.name,
          value: newExtraInfo.value
        });
      })
      .catch(ex => {
        Log.debug('UserProfileDetailStore::editUserProfile::error::', ex.message);
        PopupUtils.showError(ex.message);
      });
  }

  private showDeletePropertyConfirmation(column: EditableColumn) {
    Modals.showConfirmationModal(`Are you sure you want to delete attribute "${StringUtils.toSnakeCase(column.column.displayName)}"?`, {
      onOk: () => this.handleDeleteProperty(column)
    });
  }

  private handleDeleteProperty(column: EditableColumn) {
    const properties = this.userFullDetailInfo?.profile?.properties ?? {};
    const request: EditUserPropertyRequest = new EditUserPropertyRequest(this.userFullDetailInfo?.profile?.username!, properties, [column.column.displayName]);
    UserDetailModule.updateUserProperties(request).catch(ex => {
      Log.debug('UserProfileDetailStore::handleDeleteProperty::error::', ex.message);
      PopupUtils.showError(ex.message);
    });
  }

  // @Track(TrackEvents.AddExtraUserInfo, {
  //   user_id: (_: ContactDetailsForm, args: any) => _.userFullDetailInfo?.profile?.username,
  //   user_email: (_: ContactDetailsForm, args: any) => _.userFullDetailInfo?.profile?.email,
  //   user_full_name: (_: ContactDetailsForm, args: any) => _.userFullDetailInfo?.profile?.fullName
  // })
  // private handleAddNewField() {
  //   this.addNewFieldModal.show();
  // }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.profile-details-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden !important;
  padding-right: 28px;

  .user-property {
    position: relative;
    display: flex;
    align-items: center;

    i {
      position: absolute;
      right: -28px;
      margin-bottom: 24px;
    }
  }

  .attribute-label {
    .title {
      text-align: left;
      padding: 16px 0;
      @include regular-text(0.6px, var(--secondary-text-color));
      font-weight: 500;
    }

    display: flex;
    align-items: center;
  }

  ::v-deep .editable-form-input {
    $label-width: 130px;
    text-align: left;
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 24px;
    margin-top: 0;

    .editable-form-input-label {
      width: $label-width;
      margin: 0;
      color: var(--secondary-text-color);
      opacity: 1;
      font-size: 14px;
    }

    .editable-form-input-input {
      width: calc(100% - #{$label-width});
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      background-color: var(--primary);
      height: 42px;
      display: flex;
      align-items: center;
      $padding-x: 16px;
      padding: #{10px $padding-x};
      & > .input-group,
      & > input {
        width: calc(100% + #{$padding-x * 2});
        margin: 0 #{-$padding-x};
      }
      & > input {
        padding-left: $padding-x;
        background: transparent;

        &:focus {
          box-shadow: none;
        }
      }
      span {
        margin-left: 0;
        font-size: 14px;
        font-weight: normal;
        font-stretch: normal;
        font-style: normal;
        line-height: normal;
        letter-spacing: 0.18px;
        text-align: left;
        color: var(--secondary-text-color);
      }

      & > .relative {
        width: 100%;

        & > span > button {
          padding: 0;
        }
      }
    }
  }
}

.profile-field-item {
  margin-left: 16px;
  margin-top: 16px;

  label {
    opacity: 0.5;
    font-size: 12px;
    margin-bottom: 8px;
  }
}

.email {
  .value {
    opacity: 0.6;
    height: 42px;
    align-items: center;
    padding-top: 12px;
    cursor: default;
  }
}

.gender {
  label {
    padding-bottom: 8px;
  }
}

.date-of-birth {
  //label {
  //  //padding-bottom: 8px;
  //}
}

.date-picker {
  cursor: pointer;
  ::v-deep {
    .input-container {
      width: 100%;
      .input-calendar {
        padding-left: 0;
        margin-right: -12px;
      }
    }
  }
}

.properties {
  margin-top: 16px;
}
</style>
