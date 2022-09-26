<template>
  <div class="move-file">
    <div v-if="isShowCreateDirectoryUI">
      <div class="move-file__header-create">
        <i class="icon-back btn-icon-border di-icon-arrow-left" @click="toggleCreateFolder"></i>
        <b-input-group>
          <b-form-input placeholder="Typing name folder" autofocus autocomplete="off" v-model="folderName" @keydown.enter="emitCreateFolder" />
          <b-input-group-append>
            <DiButton primary class="create-folder" @click="emitCreateFolder">
              <i class="di-icon-check"></i>
            </DiButton>
          </b-input-group-append>
        </b-input-group>
      </div>

      <div :style="{ height: `${filesMaxHeight}px` }" class="move-file__body-create d-flex align-items-center justify-content-center">
        <div class="error-message">
          <div class="error" v-if="$v.$error" :style="{ height: `${filesMaxHeight}px` }">
            <span v-if="!$v.folderName.maxLength">Max length is 250 chars.</span>
            <span v-else-if="!$v.folderName.required">Field is required.</span>
            <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
          </div>
          <div v-if="isErrorCreateFolder" class="error" :style="{ height: `${filesMaxHeight}px` }">
            <vuescroll :ops="scrollConfig">
              <div :style="{ 'max-height': `${filesMaxHeight}px` }">
                {{ errorCreateFolderMessage }}
              </div>
            </vuescroll>
          </div>
        </div>
        <div class="d-flex align-items-center justify-content-center">Create a new folder in {{ parentDirectoryName }}</div>
      </div>
    </div>
    <div v-else>
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
                <div class="file-item cursor-pointer" v-for="(file, index) in directories" :key="index" @click="handleSelectDirectory(file)">
                  <img src="@/assets/icon/directory.svg" class="mr-3" alt="" />
                  <div class="directory-name text-truncate">
                    {{ file[displayKey] }}
                  </div>
                  <i class="ml-auto cursor-pointer fa-rotate-180 di-icon-arrow-left"></i>
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

    <div class="move-file__footer d-flex align-items-center">
      <div class="icon-new-folder cursor-pointer mr-auto" @click="toggleCreateFolder">
        <img class="" src="@/assets/icon/ic_new_folder.svg" />
      </div>
      <DiButton :disabled="isLoading || submitLoading" class="ml-auto" primary :id="genBtnId('move')" @click="handleClickMove" :title="submitTitle">
        <i v-if="submitLoading" class="fa fa-spin fa-spinner"></i>
      </DiButton>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue, Watch } from 'vue-property-decorator';
import DiIconTextButton from '@/shared/components/Common/DiIconTextButton.vue';
import DiButton from '@/shared/components/Common/DiButton.vue';
import { Status, VerticalScrollConfigs } from '@/shared';
import StatusWidget from '@/shared/components/StatusWidget.vue';
import { StringUtils } from '@/utils/string.utils';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import EmptyDirectory from '@/screens/DashboardDetail/components/EmptyDirectory.vue';
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
export default class MoveFile extends Vue {
  private statusListing: Status = Status.Loaded;
  private submitLoading = false;
  private isShowCreateDirectoryUI = false;
  private errorMessage = '';
  private folderName = '';
  private scrollConfig = VerticalScrollConfigs;
  private isErrorCreateFolder = false;
  private errorCreateFolderMessage = '';

  @Prop({ default: 'label' })
  private readonly displayKey!: string;

  @Prop({ default: 300 })
  private readonly filesMaxHeight!: number;

  @Prop({ required: true })
  parentDirectoryName!: string;

  @Prop({ type: String, default: 'MOVE' })
  submitTitle!: string;

  //listing file
  @Prop({ required: true })
  directories!: any[];

  @Prop({ type: Boolean, default: true })
  showBackAtParentDirectory!: boolean;

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

  showErrorCreateFolder(message: string) {
    this.isErrorCreateFolder = true;
    this.errorCreateFolderMessage = message;
  }

  resetCreateFolderData() {
    this.folderName = '';
    this.errorCreateFolderMessage = '';
    this.isErrorCreateFolder = false;
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

  @Track(TrackEvents.SelectFolderPath, { path: (_: MoveFile) => _.parentDirectoryName })
  @Emit('submit')
  private handleClickMove() {
    return this.parentDirectoryName;
  }

  @Emit('back')
  private handleSelectParentDirectory() {
    return this.parentDirectoryName;
  }

  toggleCreateFolder() {
    this.resetCreateFolderData();
    this.isShowCreateDirectoryUI = !this.isShowCreateDirectoryUI;
  }

  private emitCreateFolder() {
    if (this.validFolderName()) {
      this.$emit('createDirectory', this.folderName);
    }
  }

  private validFolderName() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  @Watch('folderName')
  onFolderNameChanged(newName: string) {
    this.$v.$reset();
  }
}
</script>

<style lang="scss" src="./file-management.scss" />
