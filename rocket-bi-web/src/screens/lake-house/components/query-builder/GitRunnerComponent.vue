<template>
  <div class="java-runner-setting w-100">
    <vuescroll class="java-runner-scroll">
      <div class="java-runner-setting-scroll-body">
        <div class="collapse-grid-container git-type">
          <div class="grid-item cell">Git URL:</div>
          <div class="grid-item">
            <BFormInput
              :id="genInputId('git-url')"
              class="text-truncate"
              autofocus
              autocomplete="off"
              placeholder="Your git url"
              v-model="gitURL"
              @keyup.enter="focusGitCloneInput"
            />
          </div>
          <div class="grid-item cell">Git Clone:</div>
          <div class="grid-item cell">
            <div id="clone-request-radio-group" class="d-flex flex-row align-items-center align-content-center">
              <SingleChoiceItem
                :is-selected="lakeJobJava.gitCloneInfo.className === gitCloneInfos.SSH"
                :item="cloneRequests[0]"
                class="mr-3"
                @onSelectItem="handleSelectGitCloneType"
              >
              </SingleChoiceItem>
              <SingleChoiceItem
                :is-selected="lakeJobJava.gitCloneInfo.className === gitCloneInfos.HTTPS"
                :item="cloneRequests[1]"
                @onSelectItem="handleSelectGitCloneType"
              >
              </SingleChoiceItem>
            </div>
          </div>
        </div>
        <b-collapse :visible="lakeJobJava.gitCloneInfo.className === gitCloneInfos.SSH">
          <div class="collapse-grid-container ssh-collapse">
            <div class="grid-item cell">Private Key:</div>
            <div class="grid-item">
              <BFormTextarea
                :id="genInputId('private-key')"
                hide-track-value
                ref="privateKeyInput"
                class="private-key"
                autocomplete="off"
                placeholder="Input SSH private key"
                v-model="privateKey"
              />
            </div>
          </div>
        </b-collapse>
        <b-collapse class="d-none" :visible="lakeJobJava.gitCloneInfo.className === gitCloneInfos.HTTPS">
          <div class="collapse-grid-container http-collapse">
            <div class="grid-item cell">Username:</div>
            <div class="grid-item">
              <BFormInput
                :id="genInputId('build-cmd')"
                class="text-truncate"
                ref="usernameInput"
                autocomplete="off"
                placeholder="Username"
                v-model="username"
                @keydown.enter="() => $refs.passwordInput.focus()"
              />
            </div>

            <div class="grid-item cell">Password:</div>
            <div class="grid-item">
              <BFormInput
                class="text-truncate"
                ref="passwordInput"
                type="password"
                autocomplete="off"
                placeholder="Password"
                v-model="password"
                @keydown.enter="() => $refs.buildCMDInput.focus()"
              />
            </div>
          </div>
        </b-collapse>
        <div class="collapse-grid-container build-tool-cmd">
          <div class="grid-item cell">Build Tool:</div>
          <div class="grid-item cell">
            <div id="build-tool-radio-group" class="d-flex flex-row align-items-center align-content-center">
              <SingleChoiceItem
                :is-selected="lakeJobJava.buildTool === buildTool.Maven"
                :item="buildTools[0]"
                class="mr-3"
                @onSelectItem="handleSelectBuildTool"
              >
                <img src="@/screens/lake-house/assets/maven.png" alt="maven" />
              </SingleChoiceItem>
              <SingleChoiceItem :is-selected="lakeJobJava.buildTool === buildTool.Sbt" :item="buildTools[1]" @onSelectItem="handleSelectBuildTool">
                <img src="@/screens/lake-house/assets/sbt.png" alt="sbt" />
              </SingleChoiceItem>
            </div>
          </div>
          <div class="grid-item cell">Build CMD:</div>
          <div class="grid-item cell">
            <BFormInput
              class="text-truncate"
              ref="buildCMDInput"
              autocomplete="off"
              :placeholder="buildCMDPlaceHolder"
              v-model="lakeJobJava.buildCmd"
              @keydown.enter="handleSubmitAction"
            />
          </div>
        </div>
      </div>
    </vuescroll>
    <div class="editor-footer">
      <DiButton primary :disabled="isDisableCreateJob" :title="actionTitle" @click="handleSubmitAction"></DiButton>
    </div>
    <JavaLakeJobConfigModal :is-show.sync="isShowJobModalConfig" :job="lakeJobJava" @created="handleJobCreated"></JavaLakeJobConfigModal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { BuildTool } from '@core/lake-house/domain/lake-job/BuildTool';
import { JavaJob } from '@core/lake-house/domain/lake-job/JavaJob';
import { LakeJob } from '@core/lake-house/domain/lake-job/LakeJob';
import { Routers, SelectOption } from '@/shared';
import JavaLakeJobConfigModal from '@/screens/lake-house/views/job/config-modals/JavaLakeJobConfigModal.vue';
import { UnsupportedException } from '@core/common/domain/exception/UnsupportedException';
import { StringUtils } from '@/utils/StringUtils';
import { GitCloneInfos } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfos';
import { HTTPSInfo } from '@core/lake-house/domain/lake-job/git-clone-info/HTTPSInfo';
import { SSHInfo } from '@core/lake-house/domain/lake-job/git-clone-info/SSHInfo';
import { BFormInput, BFormTextarea } from 'bootstrap-vue';
import { GitCloneInfo } from '@core/lake-house/domain/lake-job/git-clone-info/GitCloneInfo';
import Vuescroll from 'vuescroll';
import { RouterUtils } from '@/utils/RouterUtils';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: { JavaLakeJobConfigModal }
})
export default class GitRunnerComponent extends Vue {
  private readonly buildTool = BuildTool;
  private readonly gitCloneInfos = GitCloneInfos;
  private lakeJobJava: JavaJob = JavaJob.default();
  private isShowJobModalConfig = false;
  private username = '';
  private password = '';
  private privateKey = '';
  private gitURL = '';

  private readonly buildTools: SelectOption[] = [
    { displayName: '', id: BuildTool.Maven },
    { displayName: '', id: BuildTool.Sbt }
  ];

  private readonly cloneRequests: SelectOption[] = [
    { displayName: 'SSH', id: GitCloneInfos.SSH },
    { displayName: 'HTTPS', id: GitCloneInfos.HTTPS }
  ];

  @Prop()
  job!: LakeJob;

  @Ref()
  private readonly privateKeyInput?: BFormTextarea;

  @Ref()
  private readonly usernameInput?: BFormInput;

  @Ref()
  vuescroll!: Vuescroll;

  private get actionTitle(): string {
    if (this.job) {
      const isEditJob = !this.job.isCreate;
      return isEditJob ? 'Edit Job' : 'Create Job';
    } else {
      return 'Create Job';
    }
  }

  private get buildCMDPlaceHolder() {
    switch (this.lakeJobJava.buildTool) {
      case BuildTool.Maven:
        return 'mvn package -Dskiptests';
      case BuildTool.Sbt:
        return 'sbt package';
      default:
        throw new UnsupportedException(`Unsupported build tool ${this.lakeJobJava.buildCmd}`);
    }
  }

  private get isDisableCreateJob(): boolean {
    const notValidGitCloneInfo = !this.lakeJobJava.gitCloneInfo.isValid();
    const emptyBuildCMD = StringUtils.isEmpty(this.lakeJobJava.buildCmd);
    return notValidGitCloneInfo || emptyBuildCMD;
  }

  created() {
    TrackingUtils.track(TrackEvents.LakeJavaJobBuilderView, {});
  }

  private handleSubmitAction() {
    this.setGitCloneInfoToJob();
    this.showJobConfigModal();
    this.trackJobEvent();
  }

  private trackJobEvent() {
    if (this.lakeJobJava.isCreate) {
      TrackingUtils.track(TrackEvents.LakeCreateJavaJob, {});
    } else {
      TrackingUtils.track(TrackEvents.LakeEditJavaJob, { job_name: this.lakeJobJava.name, job_id: this.lakeJobJava.jobId });
    }
  }

  private trackSubmitJobEvent() {
    if (this.lakeJobJava.isCreate) {
      TrackingUtils.track(TrackEvents.LakeSubmitCreateJavaJob, {});
    } else {
      TrackingUtils.track(TrackEvents.LakeSubmitEditJavaJob, { job_name: this.lakeJobJava.name, job_id: this.lakeJobJava.jobId });
    }
  }

  private setGitCloneInfoToJob() {
    switch (this.lakeJobJava.gitCloneInfo.className) {
      case GitCloneInfos.HTTPS: {
        this.lakeJobJava.setGitCloneInfo(new HTTPSInfo(this.gitURL, this.username, this.password));
        break;
      }
      case GitCloneInfos.SSH: {
        this.lakeJobJava.setGitCloneInfo(new SSHInfo(this.gitURL, this.privateKey));
        break;
      }
      default:
        throw new UnsupportedException(`Unsupported git clone type ${this.lakeJobJava.gitCloneInfo.className}`);
    }
  }

  private showJobConfigModal() {
    if (!this.isDisableCreateJob) {
      this.isShowJobModalConfig = true;
    }
  }

  private handleSelectBuildTool(item: SelectOption) {
    this.lakeJobJava.buildTool = item.id as BuildTool;
    TrackingUtils.track(TrackEvents.SelectBuildTool, { type: item.id });
  }

  private handleSelectGitCloneType(item: SelectOption) {
    switch (item.id as GitCloneInfos) {
      case GitCloneInfos.HTTPS: {
        this.lakeJobJava.gitCloneInfo = new HTTPSInfo(this.gitURL, this.username, this.password);
        TrackingUtils.track(TrackEvents.SelectGitCloneHTTPS, {});
        break;
      }
      case GitCloneInfos.SSH: {
        this.lakeJobJava.gitCloneInfo = new SSHInfo(this.gitURL, this.privateKey);
        TrackingUtils.track(TrackEvents.SelectGitCloneSSH, {});
        break;
      }
      default:
        throw new UnsupportedException(`Unsupported git clone type ${item.id}`);
    }
  }

  private focusGitCloneInput() {
    switch (this.lakeJobJava.gitCloneInfo.className) {
      case GitCloneInfos.HTTPS: {
        this.usernameInput?.focus();
        break;
      }
      case GitCloneInfos.SSH: {
        this.privateKeyInput?.focus();
        break;
      }
      default:
        throw new UnsupportedException(`Unsupported git clone type ${this.lakeJobJava.gitCloneInfo.className}`);
    }
  }

  @Watch('job', { immediate: true, deep: true })
  onJobChanged(newJob: LakeJob) {
    if (newJob) {
      this.lakeJobJava = newJob as JavaJob;
      //todo: set git clone info with case edit
      this.updateGitCloneInfo();
    } else {
      this.lakeJobJava = JavaJob.default();
      this.reset();
    }
  }

  private reset() {
    this.username = '';
    this.password = '';
    this.privateKey = '';
    this.gitURL = '';
  }

  private updateGitCloneInfo() {
    switch (this.lakeJobJava.gitCloneInfo.className) {
      case GitCloneInfos.SSH: {
        const sshCloneInfo = this.lakeJobJava.gitCloneInfo as SSHInfo;
        this.gitURL = sshCloneInfo.url;
        this.privateKey = sshCloneInfo.privateKey;
        break;
      }
      case GitCloneInfos.HTTPS: {
        const httpCloneInfo = this.lakeJobJava.gitCloneInfo as HTTPSInfo;
        this.gitURL = httpCloneInfo.url;
        this.username = httpCloneInfo.username;
        this.password = httpCloneInfo.password;
        break;
      }
    }
  }

  private handleJobCreated() {
    RouterUtils.to(Routers.LakeJob);
    this.trackSubmitJobEvent();
  }

  @Watch('gitURL')
  onGitURLChanged() {
    this.setGitCloneInfoToJob();
  }

  @Watch('password')
  onPasswordChanged() {
    this.setGitCloneInfoToJob();
  }

  @Watch('username')
  onUsernameChanged() {
    this.setGitCloneInfoToJob();
  }

  @Watch('privateKey')
  onPrivateKeyChanged() {
    this.setGitCloneInfoToJob();
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.java-runner-setting {
  text-align: left;
  background: var(--secondary);
  height: calc(100% - 42px);
  padding: 24px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  .java-runner-scroll {
    .java-runner-setting-scroll-body {
      text-align: left;
      background: var(--secondary);
      padding-right: 15px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  }

  //grid-template-rows: 34px 34px 34px;
  .grid-container {
    display: grid;
    row-gap: 0px;
    grid-template-columns: minmax(83px, max-content) 400px;

    .grid-item {
      display: flex;
      align-items: center;
      height: 34px;
      margin-bottom: 8px;
      row-gap: 0;
      input {
        padding: 0 16px;
        font-size: 14px;
        height: 34px;
        &::placeholder {
          font-size: 12px;
        }
      }
      #build-tool-radio-group,
      #clone-request-radio-group {
        > .choice-item {
          margin-right: 25px;
          height: fit-content;
        }
        img {
          margin-left: 6px;
          height: 16px;
        }
      }
    }
  }

  .collapse-grid-container.git-type,
  .collapse-grid-container.http-collapse {
    grid-template-rows: minmax(42px, max-content) minmax(42px, max-content);
  }
  .collapse-grid-container.ssh-collapse,
  .collapse-grid-container.build-tool-cmd {
    grid-template-rows: minmax(42px, max-content);
  }

  .collapse-grid-container {
    display: grid;
    row-gap: 0px;
    grid-template-columns: minmax(83px, max-content) 400px;

    .grid-item {
      align-self: start;
    }
    .private-key {
      padding: 8px 16px;
      height: 300px !important;
      margin-bottom: 8px;
      display: flex;
      align-items: center;

      &::placeholder {
        padding-top: 4px;
      }
    }
    .cell {
      display: flex;
      align-items: center;
      height: 34px;
      @include regular-text-14;
      color: var(--secondary-text-color);
    }
    input {
      padding: 0 16px;
      font-size: 14px;
      height: 34px;
      &::placeholder {
        font-size: 12px;
      }
    }
    #build-tool-radio-group,
    #clone-request-radio-group {
      > .choice-item {
        margin-right: 25px;
        height: fit-content;
      }
      img {
        margin-left: 6px;
        height: 16px;
      }
    }
  }

  .editor-footer {
    display: flex;
    flex-direction: row;
    margin-top: 12px;
    margin-right: 15px;
    justify-content: flex-end;

    .di-button {
      width: 93px;
    }
    .di-button + .di-button {
      margin-left: 12px;
    }
  }
}
</style>
