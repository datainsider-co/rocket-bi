<template>
  <DiCustomModal id="mdRenameDirectory" ref="mdRenameDirectory" ok-title="Apply" title="Rename" size="md" hide-header-close @onClickOk="rename" @hidden="reset">
    <template #default="{ok}">
      <DiInputComponent label="Name" :id="genInputId('rename-directory')" v-model.trim="$v.name.$model" :placeholder="placeholder" autofocus @enter="ok()">
        <template #error>
          <div v-if="$v.name.$error" class="error">
            <span v-if="!$v.name.maxLength">Max length is 250 chars.</span>
            <span v-if="!$v.name.required">Field is required.</span>
            <span v-if="!$v.name.directoryRule">Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
          </div>
        </template>
      </DiInputComponent>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { validationMixin } from 'vuelidate';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import { Directory, DirectoryType } from '@core/common/domain/model';
import { DirectoryModule } from '@/screens/directory/store/DirectoryStore';
import { PopupUtils } from '@/utils/PopupUtils';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';

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
  private readonly mdRenameDirectory!: DiCustomModal;

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

  async rename(event: Event) {
    event.preventDefault();
    this.$v.name.$touch();
    if (this.directory && !this.$v.$invalid) {
      this.hide();
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

  hide() {
    this.$nextTick(() => {
      this.mdRenameDirectory.hide();
      this.$v.$reset();
    });
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

  private reset() {
    this.$v.$reset();
    this.name = '';
  }
}
</script>
