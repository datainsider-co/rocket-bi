<template>
  <div class="d-flex justify-content-between align-items-center">
    <div class="d-flex title">
      <div class="regular-icon-16">
        <DatabaseIcon icon-size="24"></DatabaseIcon>
      </div>
      <span align="center" class="regular-text-24">Data Ingestion</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  components: {}
})
export default class DataIngestionHeader extends Vue {}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin';

.title {
  align-items: center;
  height: 37px;
}
</style>
