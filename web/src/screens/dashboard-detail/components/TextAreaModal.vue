<template>
  <DiCustomModal id="text-area-model" ref="textAreaModel" :ok-title="actionName" :title="title" size="md" hide-header-close @onClickOk="rename" @hidden="reset">
    <template>
      <div class="di-input-component--label mb-2 justify-content-start" v-if="label">
        <b class="di-input-component--label-left mr-1" v-if="label">{{ label }}</b>
        <div>(optional)</div>
      </div>
      <b-form-textarea id="textarea" v-model.trim="name" :placeholder="placeholder" rows="3" max-rows="6"></b-form-textarea>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator';
import { Log } from '@core/utils';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';

@Component({
  components: {}
})
export default class TextAreaModal extends Vue {
  @Ref()
  private readonly textAreaModel!: DiCustomModal;

  protected title = '';
  private actionName = '';
  private label = '';
  private placeholder = '';

  name?: string;
  loading = false;
  errorMsg = '';
  onClickOk?: (newName: string) => void;

  constructor() {
    super();
    this.name = '';
  }

  show(
    currentName: string,
    onClickOk: (newName: string) => void,
    options?: {
      title?: string;
      actionName?: string;
      label?: string;
      placeholder?: string;
    }
  ) {
    this.loading = false;
    this.errorMsg = '';
    this.name = currentName;
    this.setOptions(options);
    this.textAreaModel.show();
    this.onClickOk = onClickOk;
  }

  hide() {
    this.loading = false;
    this.errorMsg = '';
    this.$nextTick(() => {
      this.textAreaModel.hide();
    });
  }

  validName() {
    return true;
  }

  rename(event: Event) {
    Log.debug('save::action');
    try {
      event.preventDefault();
      if (this.validName() && this.name && this.onClickOk) {
        this.onClickOk(this.name);
      }
    } catch (e) {
      Log.error('DiRenameModal::rename::error::', e.message);
    }
  }

  reset() {
    this.name = '';
    this.loading = false;
    this.errorMsg = '';
    this.setOptions({});
    this.onClickOk = undefined;
  }

  private setOptions(options?: { title?: string; actionName?: string; label?: string; placeholder?: string }) {
    this.title = options?.title ?? 'Content';
    this.actionName = options?.actionName ?? 'Save';
    this.label = options?.label ?? 'Description';
    this.placeholder = options?.placeholder ?? 'Enter something...';
  }
}
</script>

<style lang="scss">
#text-area-model {
  --font-size: 14px;
  textarea {
    padding: 0.5rem 1rem;
  }

  ::placeholder {
    font-size: var(--font-size);
    opacity: 1; /* Firefox */
  }

  ::-ms-input-placeholder {
    /* Edge 12 -18 */
    font-size: var(--font-size);
  }
}
</style>
