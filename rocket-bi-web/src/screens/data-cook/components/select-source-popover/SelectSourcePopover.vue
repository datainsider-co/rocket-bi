<template>
  <PopoverV2 ref="popover" :optimize="false">
    <slot></slot>
    <template v-slot:menu>
      <SelectSource ref="selectSource" @selectTable="selectTable"></SelectSource>
    </template>
  </PopoverV2>
</template>
<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { DatabaseSchema, TableSchema } from '@core/common/domain';
import SelectSource from '../select-source/SelectSource.vue';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { Track } from '@/shared/anotation';
import { TrackEvents } from '@core/tracking/enum/TrackEvents';

@Component({
  components: {
    PopoverV2,
    SelectSource
  }
})
export default class SelectSourcePopover extends Vue {
  public hide() {
    if (this.$refs.popover) {
      (this.$refs.popover as PopoverV2).hidePopover();
    }
  }

  show(reference: HTMLElement | null = null) {
    if (this.$refs.popover) {
      (this.$refs.popover as PopoverV2).showPopover(reference);
    }
  }

  private selectTable(database: DatabaseSchema, table: TableSchema) {
    this.hide();
    this.$emit('selectTable', database, table);
  }
}
</script>
