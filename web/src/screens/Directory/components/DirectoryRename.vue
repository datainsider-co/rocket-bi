<template>
  <b-modal id="mdRenameDirectory" ref="mdRenameDirectory" centered>
    <template #modal-header>
      <h6 class="modal-title">Rename</h6>
      <!--      <p class="h5 mb-2">-->
      <!--        <b-icon-x role="button" variant="light" @click="close()"></b-icon-x>-->
      <!--      </p>-->
    </template>
    <template v-slot:default="">
      <p class="mb-2">Name</p>
      <b-form-input
        :id="genInputId('rename-directory')"
        v-model.trim="$v.name.$model"
        :placeholder="placeholder"
        autofocus
        class="p-3 h-42px"
        variant="dark"
        v-on:keydown.enter="rename()"
      ></b-form-input>
      <div v-if="$v.name.$error" class="error">
        <span v-if="!$v.name.maxLength">Max length is 250 chars.</span>
        <span v-if="!$v.name.required">Field is required.</span>
        <span v-if="!$v.name.directoryRule">Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
      </div>
    </template>
    <template v-slot:modal-footer="{ cancel }">
      <b-button class="flex-fill h-42px" variant="secondary" @click="cancel()">
        Cancel
      </b-button>
      <b-button class="flex-fill h-42px" variant="primary" @click="rename()">
        Apply
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { validationMixin } from 'vuelidate';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import { Directory, DirectoryType } from '@core/domain/Model';
import { DirectoryModule } from '@/screens/Directory/store/DirectoryStore';
import { PopupUtils } from '@/utils/popup.utils';
import { Track } from '@/shared/anotation';
import MyData from '@/screens/Directory/views/MyData/MyData.vue';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

// eslint-disable-next-line no-useless-escape
const directoryRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  mixins: [validationMixin],
  validations: {
    name: {
      required,
      maxLength: maxLength(250),
      directoryRule
    }
  }
})
export default class DirectoryRename extends Vue {
  directory?: Directory;
  name = '';

  @Ref()
  private readonly mdRenameDirectory?: BModal;

  constructor() {
    super();
    this.directory = void 0;
  }

  get placeholder() {
    return 'Type new name';
  }

  show(directory: Directory) {
    this.name = directory.name;
    this.directory = directory;
    this.mdRenameDirectory?.show();
  }

  async rename() {
    this.$v.name.$touch();
    if (this.directory && !this.$v.$invalid) {
      this.mdRenameDirectory?.hide();
      switch (this.directory.directoryType) {
        case DirectoryType.Query:
        case DirectoryType.Dashboard: {
          await this.renameDashboard(this.directory);
          break;
        }
        case DirectoryType.Directory: {
          await this.renameDirectory(this.directory);
          break;
        }
      }
      this.$v.$reset();
    }
  }

  @Watch('name')
  resetDirectoryInputError() {
    this.$v.name.$reset();
  }

  private async renameDashboard(directory: Directory) {
    try {
      await DirectoryModule.renameDashboard({
        id: directory.dashboardId!,
        name: this.name,
        oldName: directory.name
      });
    } catch (ex) {
      PopupUtils.showError(ex.message);
    }
  }

  private async renameDirectory(directory: Directory) {
    try {
      await DirectoryModule.renameFolder({
        id: directory.id,
        name: this.name,
        oldName: directory.name
      });
    } catch (ex) {
      PopupUtils.showError(ex.message);
    }
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';
@import '~@/themes/scss/di-variables';
.modal-title {
  font-size: 24px;
  line-height: 1.17;
  letter-spacing: 0.2px;
  color: var(--secondary-text-color);
}
.text-white {
  @include regular-text;
  color: $primary-text-color;
  letter-spacing: 0.18px;
  text-align: center;
}

.error {
  color: var(--danger);
  font-size: 14px;
  font-stretch: normal;
  font-style: normal;
  font-weight: normal;
  letter-spacing: normal;
  line-height: normal;
  margin-top: 10px;
}
</style>
