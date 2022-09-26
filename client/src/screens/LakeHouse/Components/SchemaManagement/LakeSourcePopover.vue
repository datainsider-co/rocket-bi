<template>
  <DIPopover :isShow.sync="isShowing" :targetId="targetId" custom-class="lake-source-popover" placement="bottom">
    <div class="lake-source-scroller">
      <vuescroll :ops="ScrollOption">
        <div class="lake-source-listing">
          <template v-for="(source, index) in sources">
            <a :key="index" href="#" @click="$emit('onClickSource', source)"> {{ source }}</a>
          </template>
        </div>
      </vuescroll>
    </div>
  </DIPopover>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import DIPopover from '@/screens/DashboardDetail/components/WidgetContainer/charts/ActionWidget/DIPopover.vue';
import { VerticalScrollConfigs } from '@/shared';

@Component({
  components: { DIPopover }
})
export default class LakeSourcePopover extends Vue {
  private isShowing = false;
  private ScrollOption = VerticalScrollConfigs;

  @Prop({ required: true })
  private readonly targetId!: string;

  @Prop({ required: true, type: Array })
  private readonly sources!: string[];

  show() {
    this.isShowing = true;
  }

  hide() {
    this.isShowing = false;
  }
}
</script>

<style lang="scss">
.lake-source-popover .custom-popover {
  .lake-source-scroller {
    height: 250px;

    .lake-source-listing {
      display: flex;
      flex-direction: column;

      > a + a {
        margin-top: 8px;
      }

      a {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}
</style>
