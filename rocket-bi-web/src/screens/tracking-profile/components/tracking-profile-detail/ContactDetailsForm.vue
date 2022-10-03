<template>
  <vuescroll :ops="scrollOption" class="scroll-area">
    <div class="profile-details-form">
      <template v-for="(item, index) in profileEditableColumns">
        <EditProfileColumn
          :item="item"
          backgroundColor="transparent"
          inputBackgroundColor="#597FFF0D"
          @editableFormInputSaved="updateContactInfo"
          :key="index"
          :maxSpanWidth="maxSpanWidth"
        />
      </template>
    </div>
  </vuescroll>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import vuescroll, { Config } from 'vuescroll';
import { camelCase } from 'lodash';
import { DefaultScrollConfig } from '@/shared';
import EditProfileColumn from '@/screens/tracking-profile/components/tracking-profile-detail/EditProfileColumn.vue';
import { ProfileActivityModule } from '@/screens/tracking-profile/store/ProfileActivityStore';
import { EditableColumn } from '@core/common/domain/model/column/implement/EditableColumn';
import { GenericColumn } from '@core/common/domain/model/column/implement/GenericColumn';
import { UpdateTrackingProfileRequest } from '@core/tracking/domain/request/UpdateTrackingProfileRequest';
import { TrackingProfileResponse } from '@core/tracking/domain/response/TrackingProfileResponse';

@Component({
  components: {
    EditProfileColumn,
    vuescroll
  }
})
export default class ContactDetailsForm extends Vue {
  private get trackingProfile(): TrackingProfileResponse {
    return ProfileActivityModule.trackingProfile!;
  }

  @Prop({ type: Number })
  maxSpanWidth!: number;

  scrollOption: Config = DefaultScrollConfig;

  constructor() {
    super();
  }

  get profile() {
    return this.trackingProfile?.profile;
  }

  get columns(): any {
    return this.trackingProfile?.columns;
  }

  get profileEditableColumns() {
    return this.buildProfileEditableColumns();
  }

  async updateContactInfo(editableProfileColumn: EditableColumn) {
    const properties = {
      [editableProfileColumn.column.name]: editableProfileColumn.value
    };
    const request = new UpdateTrackingProfileRequest(this.profile.userId, properties as any);
    await ProfileActivityModule.updateProfile(request);
  }

  private buildProfileEditableColumns(): EditableColumn[] {
    const result: EditableColumn[] = [];
    const nestedCols: EditableColumn[] = [];
    for (const [key, value] of Object.entries(this.columns)) {
      if (this.isIgnoreColumns(key)) {
        const profileColumn = new GenericColumn(value);
        if (profileColumn.nestedColumns) {
          for (const [nestedKey, nestedValue] of Object.entries(profileColumn.nestedColumns)) {
            if (this.isIgnoreColumns(nestedKey)) {
              const nestedProfileColumn = new GenericColumn(nestedValue);
              const value = this.profile[camelCase(nestedProfileColumn.name)];
              nestedCols.push(new EditableColumn(nestedProfileColumn, value));
            }
          }
        } else {
          const value = this.profile[camelCase(profileColumn.name)];
          const field = new EditableColumn(profileColumn, value);
          result.push(field);
        }
      }
    }
    result.push(...nestedCols);
    return result;
  }

  isIgnoreColumns(key: string) {
    return key !== 'createdTime' && key !== 'updatedTime' && key !== 'userId' && key !== 'diTrackingId';
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.profile-details-form {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden !important;
  padding-right: 8px;
}

.scroll-area {
  height: calc(100vh - 548px) !important;
  padding-bottom: 24px !important;
}
</style>
