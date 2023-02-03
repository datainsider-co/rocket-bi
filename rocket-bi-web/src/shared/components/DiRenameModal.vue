<template>
  <BModal :id="id" ref="mdRename" centered ok-title="Rename" cancel-title="Cancel" :title="title" class="rounded" size="md" @ok="rename">
    <template v-slot:modal-header="{ close }">
      <h6 class="modal-title">{{ title }}</h6>
      <button type="button" class="close btn-ghost" @click.prevent="close()" aria-label="Close" v-show="false">
        <BIconX class="button-x" />
      </button>
    </template>
    <template v-slot:default="{ ok }">
      <p class="mb-2">{{ label }}</p>
      <b-input
        :disabled="loading"
        :id="genInputId('rename')"
        v-model="name"
        type="text"
        variant="dark"
        class="p-3 h-42px"
        :placeholder="placeholder"
        autofocus
        autocomplete="off"
        v-on:keyup.enter="ok()"
      />
      <div class="error" v-if="$v.$error">
        <span v-if="!$v.name.maxLength">Max length is 250 chars.</span>
        <span v-else-if="!$v.name.required">Field is required.</span>
        <span v-else>Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
      </div>
      <div class="error" v-if="errorMsg">
        {{ errorMsg }}
      </div>
    </template>
    <template v-slot:modal-footer="{ cancel, ok }">
      <b-button class="flex-fill h-42px" variant="secondary" @click="cancel()">
        Cancel
      </b-button>
      <b-button :disabled="loading" class="flex-fill h-42px" variant="primary" @click="ok()">
        <i v-if="loading" class="fa fa-spin fa-spinner"></i>
        {{ actionName }}
      </b-button>
    </template>
  </BModal>
</template>

<script lang="ts">
import { Component, Prop, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { helpers, maxLength, required } from 'vuelidate/lib/validators';
import { Log } from '@core/utils';

// eslint-disable-next-line no-useless-escape
const directoryRule = helpers.regex('directoryRule', /^[^\\\/\?\*\"\>\<\:\|]*$/);

@Component({
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
  private readonly mdRename!: BModal;

  @Prop({ type: String, required: false, default: 'mdRename' })
  private readonly id!: string;

  @Prop({ type: String, default: 'Rename' })
  title!: string;

  @Prop({ type: String, default: 'Rename' })
  actionName!: string;

  @Prop({ type: String, default: 'Name' })
  label!: string;

  @Prop({ type: String, default: 'Input your title' })
  placeholder!: string;

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
        // this.$emit('rename', this.name, this.data);
        this.onClickOk(this.name);
      }
    } catch (e) {
      Log.error('DiRenameModal::rename::error::', e.message);
    }
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  setError(errorMsg: string) {
    this.errorMsg = errorMsg;
  }

  @Watch('name')
  onChangeName(newName: string) {
    this.$v.$reset();
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/di-variables.scss';
.modal-title {
  font-size: 24px;
  line-height: 1.17;
  letter-spacing: 0.2px;
  color: var(--secondary-text-color);
}
.button-x {
  color: $greyTextColor;
}

.button {
  padding: 4px;
}

.modal-header .close {
  padding: 4px;
  margin: -2px;
}

.error {
  font-family: Barlow;
  font-size: 14px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  color: var(--danger);
  margin-top: 10px;

  word-break: break-word;
}
</style>
