<template>
  <div :style="refreshButtonStyle" class="refresh-button-container">
    <b-input-group class="d-flex">
      <DiButton :primary="isPrimaryButton" class="ml-auto" :title="refreshButtonTitle" @click="handleRefresh">
        <i class="di-icon-reset job-action-icon"></i>
      </DiButton>
      <b-input-group-append>
        <PopoverV2 placement="bottom-end" class="refresh-button-popover dropdown" auto-hide>
          <DiButton :primary="isPrimaryButton" class="dropdown-button">
            <i class="di-icon-arrow-down"></i>
          </DiButton>
          <template v-slot:menu>
            <ul class="dropdown-menu">
              <option
                v-for="option in autoRefreshOptions"
                class="dropdown-item cursor-pointer"
                :key="option.displayName"
                @click="handleSelectRefreshOption(option)"
              >
                {{ option.displayName }}
              </option>
            </ul>
          </template>
        </PopoverV2>
      </b-input-group-append>
    </b-input-group>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import PopoverV2 from '@/shared/components/common/popover-v2/PopoverV2.vue';
import { Log } from '@core/utils';
import NProgress from 'nprogress';
import { RefreshOption } from '@/screens/data-ingestion/interfaces/RefreshOption';

@Component({
  components: {
    PopoverV2
  }
})
export default class RefreshButton extends Vue {
  private interval = 0;

  private readonly autoRefreshOptions: RefreshOption[] = [
    {
      displayName: 'Auto Refresh 5s',
      time: 5000,
      autoRefresh: true
    },
    {
      displayName: 'Auto Refresh 15s',
      time: 15000,
      autoRefresh: true
    },
    {
      displayName: 'Auto Refresh 30s',
      time: 30000,
      autoRefresh: true
    },
    {
      displayName: 'Auto Refresh 1m',
      time: 60000,
      autoRefresh: true
    },
    {
      displayName: 'Manual Refresh',
      time: 0,
      autoRefresh: false
    }
  ];

  @Prop({ required: false, default: '' })
  private readonly processParentId!: string;

  @Prop({ required: true })
  private selectedRefreshOption!: RefreshOption;

  private get refreshButtonStyle() {
    return {
      background: this.selectedRefreshOption.autoRefresh ? 'var(--accent)' : '#fff'
    };
  }

  private get isPrimaryButton() {
    return this.selectedRefreshOption.autoRefresh;
  }

  private get refreshButtonTitle() {
    return this.selectedRefreshOption.displayName;
  }

  mounted() {
    this.handleAutoRefresh(this.selectedRefreshOption);
  }

  handleRefresh() {
    Log.debug('manual refresh');

    this.$emit('refresh');
  }

  handleSelectRefreshOption(option: RefreshOption) {
    this.$emit('changeOption', option);
    this.$emit('refresh');
    this.handleAutoRefresh(option);
  }

  private handleAutoRefresh(selectedRefreshOption: RefreshOption) {
    Log.debug('RefreshButton::handleAutoRefresh::clearInterval', selectedRefreshOption.autoRefresh);
    clearInterval(this.interval);
    if (selectedRefreshOption.autoRefresh) {
      //wait auto refresh time and call refresh
      this.interval = setInterval(async () => {
        this.$emit('refresh');
        Log.debug('auto refresh');
      }, selectedRefreshOption.time);
    }
  }

  beforeDestroy() {
    clearInterval(this.interval);
  }
}
</script>
<style lang="scss">
.refresh-button-container {
  background: var(--accent);
  border-radius: 4px;

  .input-group {
    flex-wrap: nowrap;
  }

  .di-button {
    height: 28px;
    padding: 6px;
  }

  .dropdown-button {
    display: block;
  }
}
</style>
