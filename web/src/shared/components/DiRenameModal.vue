<template>
  <DiCustomModal :id="id" ref="mdRename" :ok-title="actionName" :title="title" size="md" hide-header-close @onClickOk="rename" @hidden="reset">
    <template #default="{ok}">
      <DiInputComponent
        :disabled="loading"
        :id="genInputId('rename')"
        v-model.trim="name"
        type="text"
        variant="dark"
        :placeholder="placeholder"
        :label="label"
        autofocus
        autocomplete="off"
        @enter="ok()"
      >
        <template #error>
          <div class="error" v-if="$v.$error">
            <span v-if="!$v.name.maxLength">Max length is 250 chars.</span>
            <span v-else-if="!$v.name.required">Field is required.</span>
            <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
          </div>
          <div class="error" :title="errorMsg" v-if="errorMsg">
            {{ errorMsg }}
          </div>
        </template>
      </DiInputComponent>
    </template>
  </DiCustomModal>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import { Log } from '@core/utils';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';

// eslint-disable-next-line no-useless-escape
const directoryRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
  components: { DiInputComponent },
  validations: {
    name: {
      required,
      maxLength: maxLength(250),
      directoryRule
    }
  }
})
export default class DiRenameModal extends Vue {
  @Ref()
  private readonly mdRename!: DiCustomModal;

  @Prop({ type: String, required: false, default: 'mdRename' })
  private readonly id!: string;

  @Prop({ type: String, default: 'Rename' })
  private readonly title!: string;

  @Prop({ type: String, default: 'Rename' })
  private readonly actionName!: string;

  @Prop({ type: String, default: 'Name' })
  private readonly label!: string;

  @Prop({ type: String, default: 'Input your title' })
  private readonly placeholder!: string;

  name?: string;
  // data: object = {};
  loading = false;
  errorMsg = '';
  onClickOk?: (newName: string) => void;

  constructor() {
    super();
    this.name = '';
  }

  show(currentName: string, onClickOk: (newName: string) => void) {
    this.loading = false;
    this.errorMsg = '';
    this.name = currentName;
    this.mdRename.show();
    this.onClickOk = onClickOk;
  }

  hide() {
    this.loading = false;
    this.errorMsg = '';
    this.$nextTick(() => {
      this.mdRename.hide();
      this.$v.$reset();
    });
  }

  validName() {
    this.$v.$touch();
    if (this.$v.$invalid) {
      return false;
    }
    return true;
  }

  rename(event: Event) {
    try {
      event.preventDefault();
      if (this.validName() && this.name && this.onClickOk) {
        this.onClickOk(this.name);
      }
    } catch (e) {
      Log.error('DiRenameModal::rename::error::', e.message);
    }
  }

  setLoading(loading: boolean) {
    this.mdRename.setLoading(loading);
  }

  setError(errorMsg: string) {
    this.errorMsg = errorMsg;
  }

  @Watch('name')
  onChangeName(newName: string) {
    this.$v.$reset();
  }

  reset() {
    this.$v.$reset();
    this.name = '';
    this.loading = false;
    this.errorMsg = '';
    this.onClickOk = undefined;
  }
}
</script>
