<template>
  <div class="export-form">
    <div class="title mb-3">Save to</div>
    <!-- Data Lake Config -->
    <LakeHouseConfig ref="lakeHouseConfig" :lake-config.sync="dataLake" class="mb-3" @submit="emitSubmit" />
    <WareHouseConfig ref="wareConfig" :ware-house-config.sync="dataWareHouse" @submit="emitSubmit" />
  </div>
</template>

<script lang="ts">
import { Component, PropSync, Ref, Vue } from 'vue-property-decorator';
import { LakeHouseUIConfig } from '@/screens/lake-house/views/job/LakeHouseUIConfig';
import { WareHouseUIConfig } from '@/screens/lake-house/views/job/WareHouseUIConfig';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import LakeHouseConfig from '@/screens/lake-house/views/job/output-form/LakeHouseConfig.vue';
import WareHouseConfig from '@/screens/lake-house/views/job/output-form/WareHouseConfig.vue';
import { ResultOutput } from '@core/lake-house/domain/lake-job/output-info/ResultOutput';

@Component({ components: { WareHouseConfig, LakeHouseConfig, SingleChoiceItem } })
export default class OutputForm extends Vue {
  @PropSync('lakeConfig', { default: LakeHouseUIConfig.default() })
  private dataLake!: LakeHouseUIConfig;

  @Ref()
  private lakeHouseConfig!: LakeHouseConfig;

  @Ref()
  private wareConfig?: WareHouseConfig;

  @PropSync('wareHouseConfig', { default: WareHouseUIConfig.default() })
  private dataWareHouse!: WareHouseUIConfig;

  getLakeHouseOutput(): ResultOutput | undefined {
    return this.lakeHouseConfig.toOutput();
  }

  async getWareHouseOutput(): Promise<ResultOutput | undefined> {
    return this.wareConfig?.toOutput();
  }

  private emitSubmit() {
    this.$emit('submit');
  }
}
</script>

<style lang="scss">
@import '~@/screens/lake-house/views/job/output-form/OutputForm.scss';
</style>
