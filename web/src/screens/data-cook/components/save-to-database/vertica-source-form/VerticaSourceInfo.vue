<template>
  <div v-if="syncedConfiguration" class="jdbc-persist-configuration mb-3">
    <DiInputComponent placeholder="Input vertica host" autocomplete="off" label="Host" v-model="syncedConfiguration.host"></DiInputComponent>
    <DiInputComponent class="mt-2" placeholder="Input vertica port" autocomplete="off" label="Port" v-model="syncedConfiguration.port"></DiInputComponent>
    <DiInputComponent class="mt-2" placeholder="Input username" autocomplete="off" label="Username" v-model="syncedConfiguration.username"></DiInputComponent>
    <DiInputComponent
      class="mt-2"
      placeholder="Input password"
      autocomplete="off"
      label="Password"
      type="password"
      v-model="syncedConfiguration.password"
    ></DiInputComponent>
    <DiInputComponent class="mt-2" placeholder="Schema" label="Schema" autocomplete="off" v-model="syncedConfiguration.catalog"></DiInputComponent>
  </div>
</template>
<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { VerticaPersistConfiguration } from '@core/data-cook/domain/etl/third-party-persist-configuration';

@Component
export default class VerticaSourceInfo extends Vue {
  @PropSync('configuration')
  syncedConfiguration!: VerticaPersistConfiguration;
}
</script>
