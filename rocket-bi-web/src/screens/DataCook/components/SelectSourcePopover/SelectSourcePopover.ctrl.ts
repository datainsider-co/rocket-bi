import { Component, Vue } from 'vue-property-decorator';
import { DatabaseSchema, TableSchema } from '@core/domain';
import SelectSource from '../SelectSource/SelectSource.vue';
import PopoverV2 from '@/shared/components/Common/PopoverV2/PopoverV2.vue';

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

  // initSources(){
  //   this.
  // }
}
