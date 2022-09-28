<template>
  <div class="etl-incremental-config">
    <!--    <div v-for="[tblName, config] in etlConfig.mapIncrementalConfig" :key="tblName">-->
    <div class="custom-etl-form">
      <label>Select Source</label>
      <!--        <DiInputComponent :value="tblName" :disable="true"></DiInputComponent>-->
      <DiDropdown
        placeholder="Select source..."
        :value="destTableName"
        :data="dataSources"
        labelProps="destTableName"
        valueProps="destTableName"
        @selected="handleSelectSource"
        hidePlaceholderOnMenu
        :appendAtRoot="true"
      ></DiDropdown>
      <div v-if="selectedSource" class="mt-3">
        <label>Run Mode</label>
        <div class="d-flex">
          <SingleChoiceItem
            :is-selected="isFullModeConfig(selectedConfig)"
            :item="saveModes[0]"
            class="mr-3"
            @onSelectItem="handleSelectFullMode(selectedSource.destTableName)"
          />
          <SingleChoiceItem
            :is-selected="isIncrementalConfig(selectedConfig)"
            :item="saveModes[1]"
            @onSelectItem="handleSelectIncrementalMode(selectedSource.destTableName)"
          />
        </div>

        <BCollapse class="mt-3" :visible="selectedConfig && isIncrementalConfig(selectedConfig)">
          <template>
            <div class=" incremental-config">
              <div class="mr-2">
                <label>Column Name</label>
                <DiDropdown
                  placeholder="Select column..."
                  :value="selectedConfig.columnName"
                  :data="columns(selectedSource.destTableName)"
                  labelProps="name"
                  valueProps="name"
                  hidePlaceholderOnMenu
                  @change="handleColumnChanged(selectedSource.destTableName, ...arguments)"
                  :appendAtRoot="true"
                ></DiDropdown>
              </div>
              <div>
                <label>Incremental Value</label>
                <DiInputComponent @input="handleIncrementalValueChanged(selectedConfig)" v-model="selectedConfig.value" placeholder="Incremental value" />
              </div>
            </div>
            <div v-if="errorMessage" class="mt-1 error">
              {{ errorMessage }}
            </div>
          </template>
        </BCollapse>
      </div>
    </div>
    <!--    </div>-->
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
import DiInput from '@/shared/components/Common/DiInput.vue';
import DiInputComponent from '@/shared/components/DiInputComponent.vue';
import { EtlConfig, EtlConfigs, FullModeConfig, GetDataOperator, IncrementalConfig, Config } from '@core/DataCook';
import DiDropdown from '@/shared/components/Common/DiDropdown/DiDropdown.vue';
import { Log } from '@core/utils';

@Component({
  components: { DiDropdown, DiInputComponent, DiInput }
})
export default class EtlIncrementalConfig extends Vue {
  private readonly etlConfigs = EtlConfigs;
  private selectedSource: GetDataOperator | null = null;
  private selectedConfig: Config | null = null;
  private errorMessage = '';

  @Prop({ required: true })
  private dataSources!: GetDataOperator[];

  @Prop({ required: true })
  private etlConfig!: EtlConfig;

  private get destTableName() {
    return this.selectedSource?.destTableName ?? '';
  }

  public getIncrementalConfig(): EtlConfig {
    const finalConfigAsMap = new Map<string, Config>();
    this.etlConfig.mapIncrementalConfig.forEach((value, key) => {
      if (Config.isIncrementalConfig(value)) {
        finalConfigAsMap.set(key, value);
      }
    });

    return new EtlConfig(finalConfigAsMap);
  }

  private columns(tblName: string) {
    const source = this.dataSources.find(source => source.destTableConfig.tblName === tblName);
    if (source) {
      return source.tableSchema.columns;
    } else {
      return [];
    }
  }

  private isIncrementalConfig(config: Config) {
    return Config.isIncrementalConfig(config);
  }

  private isFullModeConfig(config: Config) {
    return Config.isFullModeConfig(config);
  }

  private readonly saveModes: SelectOption[] = [
    { displayName: 'Full', id: EtlConfigs.Full },
    { displayName: 'Incremental', id: EtlConfigs.Incremental }
  ];

  private handleColumnChanged(tblName: string, colName: string) {
    this.errorMessage = '';
    (this.selectedConfig as IncrementalConfig).columnName = colName;
    this.etlConfig.mapIncrementalConfig.set(tblName, this.selectedConfig!);
    this.$forceUpdate();
  }

  private handleIncrementalValueChanged(config: Config) {
    this.etlConfig.mapIncrementalConfig.set(this.selectedSource!.destTableName, config);
  }

  private handleSelectSource(source: GetDataOperator) {
    Log.debug('EtlIncrementalColumn::handleSelectSource::source::', source);
    if (this.selectedConfig && Config.isIncrementalConfig(this.selectedConfig) && !this.selectedConfig.isValid) {
      this.errorMessage = 'Column name is required.';
      return;
    }
    if (this.selectedSource?.destTableName !== source.destTableName) {
      this.selectedSource = source;
      this.selectedConfig = this.etlConfig.mapIncrementalConfig.get(source.destTableName)!;
    }
  }

  private handleSelectFullMode(tblName: string) {
    if (this.isIncrementalConfig(this.selectedConfig!)) {
      Log.debug('EtlIncrementalColumn::handleSelectFullMode::tableName::', tblName);

      this.etlConfig.mapIncrementalConfig.set(tblName, new FullModeConfig());
      this.selectedConfig = new FullModeConfig();
    }
  }

  private handleSelectIncrementalMode(tblName: string) {
    if (this.isFullModeConfig(this.selectedConfig!)) {
      Log.debug('EtlIncrementalColumn::handleSelectIncrementalMode::tableName::', tblName);
      this.etlConfig.mapIncrementalConfig.set(tblName, IncrementalConfig.default());
      this.selectedConfig = IncrementalConfig.default();
    }
  }

  private handleUpdateConfigs() {
    this.$emit('update', this.etlConfig);
  }
}
</script>

<style lang="scss">
.etl-incremental-config {
  .di-input-component--input {
    height: 33px;
  }
  .select-container {
    margin-top: 0;

    input,
    button {
      height: 33px;
    }
    ul {
      li {
        height: 33px;
      }
    }
  }

  .incremental-config {
    display: flex;
    align-items: center;
    > div {
      width: 50%;
    }
  }

  .custom-etl-form {
    //margin-bottom: 25.6px;
  }

  label {
    opacity: 0.8;
  }
}
</style>
