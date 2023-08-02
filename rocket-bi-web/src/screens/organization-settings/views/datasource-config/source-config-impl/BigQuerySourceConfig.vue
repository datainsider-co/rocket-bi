<template>
  <div id="bigquery-source-config">
    <div id="config-container">
      <div>
        <div class="title unselectable mb-1">Credentials <span class="required">*</span></div>
        <b-form-input
          class="text-truncate"
          id="account-input"
          v-model="source.credentials"
          placeholder="Input account"
          :class="{ error: credentialsError.length > 0 }"
        />
        <div class="text-danger mt-1">{{ credentialsError }}</div>
      </div>
      <div>
        <div class="title unselectable mb-1">Project ID <span class="required">*</span></div>
        <b-form-input
          class="text-truncate"
          id="project-input"
          v-model="source.projectId"
          placeholder="ex: datainisder-project"
          :class="{ error: projectIdError.length > 0 }"
        />
        <div class="text-danger mt-1">{{ projectIdError }}</div>
      </div>
      <div>
        <div class="title unselectable mb-1">Location <span class="required">*</span></div>
        <DiDropdown
          v-model="source.location"
          :data="locations"
          label-props="label"
          boundary="viewport"
          hidePlaceholderOnMenu
          appendAtRoot
          placeholder="Choose location"
          value-props="type"
          :class="{ error: locationError.length > 0 }"
        >
          <!--          <template slot="before-menu" slot-scope="{ hideDropdown }">-->
          <!--            <li class="active color-di-primary font-weight-normal" @click.prevent="selectDefaultLocation(hideDropdown)">-->
          <!--              Default-->
          <!--            </li>-->
          <!--          </template>-->
        </DiDropdown>
        <div class="text-danger mt-1">{{ locationError }}</div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { Vue, Component, PropSync, Watch } from 'vue-property-decorator';
import { BigquerySource } from '@core/clickhouse-config';
import { InvalidDataException } from '@core/common/domain';
import { StringUtils } from '@/utils';
import { get } from 'lodash';
import { JsonUtils, Log } from '@core/utils';

@Component({
  components: {}
})
export default class BigQuerySourceConfig extends Vue {
  private readonly locations = require('@/screens/organization-settings/views/datasource-config/source-config-impl/locations.json');
  @PropSync('model')
  private source!: BigquerySource;

  private credentialsError = '';
  private projectIdError = '';
  private locationError = '';

  @Watch('source.credentials')
  onServiceAccountChanged() {
    this.credentialsError = '';
    try {
      if (StringUtils.isNotEmpty(this.source.credentials)) {
        const credentialsAsJson = JsonUtils.fromPureJson(this.source.credentials);
        const projectId = get(credentialsAsJson, 'project_id', '');
        Log.debug('onServiceAccountChanged::', projectId);
        this.source.projectId = projectId;
      } else {
        this.source.projectId = '';
      }
    } catch (ex) {
      Log.error(ex);
    }
  }

  @Watch('source.projectId')
  onProjectIdChanged() {
    this.projectIdError = '';
  }

  @Watch('source.location')
  onLocationChanged() {
    this.locationError = '';
  }

  private selectDefaultLocation(callback?: Function) {
    this.source.location = void 0;
    callback ? callback() : null;
  }

  valid() {
    if (StringUtils.isEmpty(this.source.credentials)) {
      const error = 'Service Account is required!';
      this.credentialsError = error;
      throw new InvalidDataException(error);
    }

    if (StringUtils.isEmpty(this.source.projectId)) {
      const error = 'Project ID is required!';
      this.projectIdError = error;
      throw new InvalidDataException(error);
    }

    if (StringUtils.isEmpty(this.source.location)) {
      const error = 'Location is required!';
      this.locationError = error;
      throw new InvalidDataException(error);
    }
  }
}
</script>

<style lang="scss">
@import '~@/themes/scss/mixin';

#bigquery-source-config {
  display: flex;
  flex-direction: column;

  #config-container {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: auto;
    gap: 16px;
    margin-bottom: 16px;
  }

  .required {
    color: var(--danger);
  }

  .form-control {
    height: 40px;
    background: transparent;
    border: 1px solid #d6d6d6;
    padding: 12px 10px;

    &:focus {
      border: 2px solid #0066ff;
      padding: 12px 9px;
    }

    &.error {
      border: 2px solid var(--danger);
    }
  }

  .select-container {
    button {
      background: transparent;
      border: 1px solid #d6d6d6;
      height: 38px;
    }

    .form-control {
      background: unset;
      border: unset;
      padding: unset;
    }

    &.error {
      button {
        border: 2px solid var(--danger);
      }
    }

    .color-di-primary {
      color: var(--accent);
    }
  }
}
</style>
