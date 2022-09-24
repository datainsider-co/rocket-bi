<template>
  <DiCustomModal ref="customModal" dialogClass="source-selection-modal" size="xl" @onClickOk="handleClickOk">
    <div>
      <SourceSelection ref="sourceSelection" @selectedFilesChanged="handleSelectedFilesChanged" />
    </div>
    <div v-if="isError" class="mt-2 error-message">{{ errorMessage }}</div>
    <template v-slot:modal-footer="{ cancel }">
      <div class="flex-grow-1 flex-shrink-1"></div>
      <b-button class="flex-grow-1 flex-shrink-1 h-42px mr-2 my-0 ml-0" variant="secondary" @click="cancel()">
        Cancel
      </b-button>
      <b-button :disabled="isLoading" class="flex-grow-1 flex-shrink-1 h-42px mr-0 my-0 ml-2" variant="primary" @click="handleClickOk">
        <i v-if="isLoading" class="fa fa-spin fa-spinner"></i>
        Select
      </b-button>
      <div class="flex-grow-1 flex-shrink-1"></div>
    </template>

    <template #modal-header>
      <div></div>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { Component, Ref, Vue } from 'vue-property-decorator';
import { helpers } from 'vuelidate/lib/validators';
import MessageContainer from '@/shared/components/MessageContainer.vue';
import { AtomicAction } from '@/shared/anotation/AtomicAction';
import { Status } from '@/shared';
import LakeExplorer from '@/screens/LakeHouse/views/LakeExplorer/LakeExplorer.vue';
import SourceSelection from '@/screens/LakeHouse/Components/SourceSelection.vue';
import { Log } from '@core/utils';

// eslint-disable-next-line no-useless-escape
const nameRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  components: { SourceSelection, LakeExplorer, MessageContainer, DiCustomModal },
  validations: {}
})
export default class SourceSelectionModal extends Vue {
  private status = Status.Loaded;
  private errorMessage = '';
  private selectedSources: string[] = [];

  @Ref()
  private readonly customModal?: DiCustomModal;

  @Ref()
  private readonly sourceSelection!: SourceSelection;

  private get isError() {
    return this.status === Status.Error;
  }

  private get isLoading() {
    return this.status === Status.Loading;
  }

  private get isLoaded() {
    return this.status === Status.Loaded;
  }

  show(selectedPaths: string[]) {
    this.customModal?.show();
    this.reset();
    this.$nextTick(() => {
      this.sourceSelection?.setPaths(selectedPaths);
    });
  }

  hide() {
    this.$nextTick(() => {
      this.selectedSources = [];
      this.customModal?.hide();
      this.sourceSelection?.reset();
      this.reset();
    });
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
      this.$emit('submit', this.selectedSources);
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
    this.errorMessage = '';
    this.status = Status.Loaded;
    this.selectedSources = [];
    this.sourceSelection?.reset();
    this.$v.$reset();
  }

  private handleSelectedFilesChanged(selectedSources: string[]) {
    Log.debug('selectedSources:Changed:', selectedSources);
    this.selectedSources = selectedSources;
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin.scss';

.source-selection-modal-container {
  height: fit-content;
}

.source-selection-modal .modal-content {
  .modal-header {
    padding: 0 !important;
  }

  .modal-body {
    padding: 16px 24px 0 24px !important;
  }

  .modal-footer {
    //padding: 0 250px 16px 250px !important;
  }
}
</style>
