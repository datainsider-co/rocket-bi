<template>
  <div class="section">
    <div class="custom-control custom-switch" style="margin-bottom: 12px">
      <input id="toggle-sync-data-lake" v-model="dataLake.enable" class="custom-control-input" type="checkbox" />
      <label class="custom-control-label" for="toggle-sync-data-lake">Data Lake</label>
    </div>
    <b-collapse id="data-lake-config" v-model="dataLake.enable">
      <div class="input position-relative mb-2 mt-1">
        <BFormInput
          :id="genInputId('lake-house-path')"
          class="input-path text-truncate"
          v-model="dataLake.path"
          autocomplete="off"
          placeholder="Input path"
          @keyup.enter="emitSubmit"
        />
        <i class="position-absolute di-icon-edit"></i>
      </div>
      <!--      <div class="input mb-2 mt-1">-->
      <!--        <label>Path Pattern</label>-->
      <!--        <BFormInput v-model="dataLake.partitionPattern" autocomplete="off" placeholder="Pattern partition" />-->
      <!--      </div>-->
      <!--      <div class="d-flex flex-row align-items-end mb-2 mt-1">-->
      <!--        <label class="mb-1 mr-3">Last</label>-->
      <!--        <div class="input mr-3" style="width:10%">-->
      <!--          <BFormInput v-model="dataLake.delay" autocomplete="off" class="mr-2" @input="handleIntervalChanged" />-->
      <!--        </div>-->
      <!--        <div class="delay-unit">-->
      <!--          <DiDropdown id="time-unit-selection" v-model="dataLake.delayUnit" :data="timeUnitOptions" labelProps="displayName" valueProps="id" />-->
      <!--        </div>-->
      <!--      </div>-->
      <div v-if="!dataLake.hideSaveMode" class="d-flex flex-row align-items-center align-content-center">
        <div class="title mb-0 mr-3">Save mode</div>
        <SingleChoiceItem :is-selected="saveAsAppend" :item="saveModes[0]" class="mr-3" @onSelectItem="handleSelectSave" />
        <SingleChoiceItem :is-selected="!saveAsAppend" :item="saveModes[1]" @onSelectItem="handleSelectSave" />
      </div>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Vue } from 'vue-property-decorator';
import { LakeHouseUIConfig } from '@/screens/LakeHouse/views/Job/LakeHouseUIConfig';
import { SelectOption } from '@/shared';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import { TimeUnit, WriteMode } from '@core/LakeHouse';
import InputSetting from '@/shared/Settings/Common/InputSetting.vue';
import DropdownSetting from '@/shared/Settings/Common/DropdownSetting.vue';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';
import { TrackingUtils } from '@core/tracking/TrackingUtils';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({ components: { SingleChoiceItem, InputSetting, DropdownSetting } })
export default class LakeHouseConfig extends Vue {
  private readonly saveModes: SelectOption[] = [
    { displayName: 'Append', id: WriteMode.Append },
    { displayName: 'Replace', id: WriteMode.Replace }
  ];

  private readonly timeUnitOptions: SelectOption[] = [
    {
      displayName: 'Day',
      id: TimeUnit.DAY
    },
    {
      displayName: 'Month',
      id: TimeUnit.MONTH
    },
    {
      displayName: 'Year',
      id: TimeUnit.YEAR
    }
  ];

  @PropSync('lakeConfig', { default: LakeHouseUIConfig.default() })
  private dataLake!: LakeHouseUIConfig;

  private get saveAsAppend(): boolean {
    return this.dataLake.saveMode === WriteMode.Append;
  }

  toOutput(): ResultOutput | undefined {
    // return this.dataLake.toQueryOutputTemplate();
    return this.dataLake.toOutputInfo();
  }

  private handleSelectSave(item: SelectOption) {
    this.dataLake.saveMode = item.id as WriteMode;
    TrackingUtils.track(TrackEvents.LakeHouseSelectSaveMode, { mode: item.id });
  }

  // private handleIntervalChanged(delay: string) {
  //   let delayAsNumber = toNumber(delay);
  //   if (!isNaN(delayAsNumber)) {
  //     if (delayAsNumber < 0) {
  //       delayAsNumber = TextOutputInfo.DEFAULT_INTERVAL;
  //     }
  //     this.dataLake.delay = delayAsNumber;
  //   }
  // }

  private emitSubmit() {
    this.$emit('submit');
  }
}
</script>
<style lang="scss" scoped>
.delay-unit {
  width: 20%;

  ::v-deep {
    button {
      height: 34px;
    }
  }
}

.input {
  background: var(--input-background-color);
  border-radius: 4px;
  i {
    font-size: 16px;
    height: 100%;
    top: 0;
    right: 9px;
    display: flex;
    align-items: center;
  }
  .input-path {
    width: calc(100% - 34px);
  }
}
</style>
