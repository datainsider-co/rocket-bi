<template>
  <b-modal ref="mdCreateDirectory" id="mdCreateDirectory" centered>
    <template v-slot:modal-header="{ close }">
      <h6 class="modal-title">{{ title }} name</h6>
      <p class="h5 mb-2 btn-ghost">
        <b-icon-x role="button" :id="genBtnId('close-new-directory')" variant="light" @click="close()"></b-icon-x>
      </p>
    </template>
    <template v-slot:default="">
      <p class="mb-2">Name</p>
      <b-form-input
        :id="genInputId('directory-name')"
        v-model.trim="$v.name.$model"
        variant="dark"
        :placeholder="placeholder"
        class="p-3 h-42px"
        autocomplete="off"
        v-on:keydown.enter="create()"
        autofocus
      ></b-form-input>
      <div class="error" v-if="$v.name.$error">
        <span v-if="!$v.name.maxLength">Max length is 250 chars.</span>
        <span v-if="!$v.name.required">Field is required.</span>
        <span v-if="!$v.name.directoryRule">Field can't contain any of the following characters: /\"?*&#62;&#60;:|</span>
      </div>
    </template>
    <template v-slot:modal-footer="{ cancel }">
      <b-button :id="genBtnId('cancel-new-directory')" class="flex-fill h-42px" variant="secondary" @click="cancel()" event="cancel-create">
        Cancel
      </b-button>
      <b-button :id="genBtnId('create-new-directory')" class="flex-fill h-42px" variant="primary" @click="create()">
        Create
      </b-button>
    </template>
  </b-modal>
</template>

<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import { BModal } from 'bootstrap-vue';
import { validationMixin } from 'vuelidate';
import { required, maxLength, helpers } from 'vuelidate/lib/validators';
import { CreateDashboardRequest, CreateDirectoryRequest, CreateQueryRequest } from '@core/domain/Request';
import { DirectoryModule } from '@/screens/Directory/store/DirectoryStore';
import { PopupUtils } from '@/utils/popup.utils';
import { Log } from '@core/utils';
import { get } from 'lodash';
import { Dashboard, DirectoryType, DirectoryId } from '@core/domain';
import router from '@/router/router';
import { Routers } from '@/shared';
import { RouterUtils } from '@/utils/RouterUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';
import { Track } from '@/shared/anotation';

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
export default class DirectoryCreate extends Vue {
  @Ref()
  mdCreateDirectory!: BModal;

  name?: string;
  title: string;

  private newRequest?: CreateDirectoryRequest | CreateDashboardRequest | CreateQueryRequest;

  constructor() {
    super();
    this.title = 'Folder';
    this.name = '';
  }

  get placeholder() {
    switch (this.title) {
      case 'Folder':
        return 'Type folder name';
      case 'Analysis':
        return 'Type analysis name';
      default:
        return 'Type dashboard name';
    }
  }

  show(request: CreateDirectoryRequest | CreateDashboardRequest | CreateQueryRequest) {
    this.name = '';
    this.title = this.getTitle(request);
    this.newRequest = request;
    this.mdCreateDirectory.show();
  }

  private getTitle(request: CreateDirectoryRequest | CreateDashboardRequest | CreateQueryRequest) {
    const directoryType = get(request, 'directoryType', '');
    switch (directoryType) {
      case DirectoryType.Directory:
        return 'Folder';
      case DirectoryType.Query:
        return 'Analysis';
      default:
        return 'Dashboard';
    }
  }

  create() {
    this.$v.name.$touch();
    if (!this.$v.$invalid && this.newRequest && this.name) {
      const directoryType: DirectoryType = get(this.newRequest, 'directoryType', '');
      this.newRequest.name = this.name;
      switch (directoryType) {
        case DirectoryType.Directory: {
          DirectoryModule.createFolder(this.newRequest as CreateDirectoryRequest).catch(err => {
            PopupUtils.showError(err.message);
            Log.debug('createFolder error');
          });
          break;
        }
        case DirectoryType.Query: {
          const request = this.newRequest as CreateQueryRequest;
          DirectoryModule.createDashboard(request)
            .then(dashboard => {
              this.$emit('onCreated', dashboard);
              this.$nextTick(() => {
                this.navigateToAdhoc(request.parentDirectoryId, request.name);
              });
            })
            .catch(err => PopupUtils.showError(err.message));
          break;
        }
        default: {
          DirectoryModule.createDashboard(this.newRequest as CreateDashboardRequest)
            .then(dashboard => this.navigateToDashboard(dashboard))
            .catch(err => PopupUtils.showError(err.message));
          break;
        }
      }
      this.mdCreateDirectory.hide();
      this.$v.$reset();
    }
  }

  private navigateToDashboard(dashboard: Dashboard) {
    router.push({
      name: Routers.Dashboard,
      params: {
        name: RouterUtils.buildParamPath(dashboard.id, dashboard.name)
      },
      query: {
        token: RouterUtils.getToken(router.currentRoute)
      }
    });
  }

  private navigateToAdhoc(id: number, name: string) {
    router.push({
      name: Routers.AllData,
      params: {
        name: RouterUtils.buildParamPath(id, name)
      },
      query: {
        token: RouterUtils.getToken(router.currentRoute)
      }
    });
  }

  @Watch('name')
  resetDirectoryInputError() {
    this.$v.name.$reset();
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
  letter-spacing: 0.18px;
  text-align: center;
  color: $primary-text-color;
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
}
</style>
