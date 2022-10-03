<template>
  <BaseSelect placeholderText="Filter by month" :options="options" @change="handleFilterChanged" />
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { SelectOption } from '@/shared';
import { Log } from '@core/utils';

@Component
export default class MonthFilter extends Vue {
  get options(): SelectOption[] {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((name, index) => {
      return { displayName: name, id: index };
    });
  }

  handleFilterChanged(data: SelectOption) {
    Log.debug('handleFilterChanged', data);
  }
}
</script>
