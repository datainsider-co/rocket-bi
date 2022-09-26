<template>
  <div class="move-file">
    <div>
      <div class="move-file__header d-flex align-items-center">
        <div class="back d-flex align-items-center cursor-pointer mr-auto" @click="handleSelectParentDirectory">
          <i v-if="showBackAtParentDirectory" class="di-icon-arrow-left"></i>
          <span :class="{ 'ml-parent': !showBackAtParentDirectory }" class="directory-name text-truncate">{{ parentDirectoryName }}</span>
        </div>
      </div>
      <div class="move-file__body" ref="body" :style="{ height: `${filesMaxHeight}px` }">
        <StatusWidget :status="statusListing" :error="errorMessage">
          <template v-if="directories.length > 0">
            <vuescroll :ops="scrollConfig">
              <div :style="{ height: `${filesMaxHeight}px` }" class="file-listing">
                <div
                  class="file-item cursor-pointer"
                  :class="{ 'di-active': selectDirectory === file.dashboardId }"
                  v-for="(file, index) in directories"
                  :key="index"
                  @click="handleSelectDirectory(file)"
                >
                  <img src="@/assets/icon/directory.svg" v-if="file.directoryType === DirectoryType.Directory" class="mr-3" alt="" />
                  <img src="@/assets/icon/dashboard.svg" v-else-if="file.directoryType === DirectoryType.Dashboard" class="mr-3" alt="" />
                  <img src="@/assets/icon/query.svg" v-else-if="file.directoryType === DirectoryType.Query" class="mr-3" alt="" />
                  <div class="directory-name text-truncate">
                    {{ file.name }}
                  </div>
                  <i v-if="file.directoryType === DirectoryType.Directory" class="ml-auto cursor-pointer fa-rotate-180 di-icon-arrow-left"></i>
                </div>
              </div>
            </vuescroll>
          </template>
          <template v-else>
            <EmptyDirectory class="h-100" />
          </template>
        </StatusWidget>
      </div>
    </div>

    <div class="move-file__footer d-flex align-items-end">
      <DiButton
        :disabled="isLoading || submitLoading || !selectDirectory"
        class="ml-auto"
        primary
        :id="genBtnId('move')"
        @click="handleClickMove"
        :title="submitTitle"
      >
        <i v-if="submitLoading" class="fa fa-spin fa-spinner"></i>
      </DiButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Emit, Watch } from 'vue-property-decorator';
import { Status, VerticalScrollConfigs } from '@/shared';
import { StringUtils } from '@/utils/string.utils';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import EmptyDirectory from '@/screens/DashboardDetail/components/EmptyDirectory.vue';
import { Directory, DirectoryType, DirectoryId } from '@core/domain';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

// eslint-disable-next-line no-useless-escape
const directoryRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  components: { StatusWidget, DiButton, DiIconTextButton, EmptyDirectory },
  validations: {
    folderName: {
      required,
      maxLength: maxLength(250),
      directoryRule
    }
  }
})
export default class PickFile extends Vue {
  private DirectoryType = DirectoryType;
  private statusListing: Status = Status.Loaded;
  private submitLoading = false;
  private errorMessage = '';
  private scrollConfig = VerticalScrollConfigs;

  @Prop({ default: 300 })
  private readonly filesMaxHeight!: number;

  @Prop({ required: true })
  parentDirectoryName!: string;

  @Prop({ type: String, default: 'MOVE' })
  submitTitle!: string;

  //listing file
  @Prop({ required: true })
  directories!: Directory[];

  @Prop({ type: Boolean, default: true })
  showBackAtParentDirectory!: boolean;

  @Prop()
  selectDirectory?: DirectoryId;

  private get isLoading() {
    return this.statusListing === Status.Loading;
  }

  showLoading() {
    if (StringUtils.isEmpty(this.directories)) {
      this.statusListing = Status.Loading;
    } else {
      this.statusListing = Status.Updating;
    }
  }

  setSubmitLoading(loading: boolean) {
    this.submitLoading = loading;
  }
  showLoaded() {
    this.statusListing = Status.Loaded;
  }

  showError(errorMessage: string) {
    this.statusListing = Status.Error;
    this.errorMessage = errorMessage;
  }

  @Emit('directoryClick')
  private handleSelectDirectory(directory: any) {
    return directory;
  }

  @Track(TrackEvents.SelectFilePath, { path: (_: PickFile) => _.parentDirectoryName, file_id: (_: PickFile) => _.selectDirectory })
  @Emit('submit')
  private handleClickMove() {
    return this.parentDirectoryName;
  }

  @Emit('back')
  private handleSelectParentDirectory() {
    return this.parentDirectoryName;
  }
}
</script>

<style lang="scss" src="./file-management.scss" />
