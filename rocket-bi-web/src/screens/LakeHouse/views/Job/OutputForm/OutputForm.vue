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
import { LakeHouseUIConfig } from '@/screens/LakeHouse/views/Job/LakeHouseUIConfig';
import { WareHouseUIConfig } from '@/screens/LakeHouse/views/Job/WareHouseUIConfig';
import SingleChoiceItem from '@/shared/components/filters/SingleChoiceItem.vue';
import LakeHouseConfig from '@/screens/LakeHouse/views/Job/OutputForm/LakeHouseConfig.vue';
import WareHouseConfig from '@/screens/LakeHouse/views/Job/OutputForm/WareHouseConfig.vue';
import { ResultOutput } from '@core/LakeHouse/Domain/LakeJob/OutputInfo/ResultOutput';

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
@import '~@/screens/LakeHouse/views/Job/OutputForm/OutputForm.scss';
</style>
