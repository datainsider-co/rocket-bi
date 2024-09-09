<script lang="ts">
import { Vue, Component } from 'vue-property-decorator';
import LayoutHeader from '@/shared/components/layout-wrapper/LayoutHeader.vue';
import SearchInput from '@/shared/components/SearchInput.vue';
import DiIconTextButton from '@/shared/components/common/DiIconTextButton.vue';
import EventBus from '@/screens/organization-settings/views/sso-config/helper/EventBus';

@Component({
  components: { DiIconTextButton, SearchInput, LayoutHeader }
})
export default class SSOHeader extends Vue {
  handleKeyWordChange(text: string) {
    EventBus.$emit('sso-search', text);
  }
  handleRefresh() {
    EventBus.$emit('sso-refresh');
  }

  handleAdd() {
    EventBus.$emit('show-sso-listing');
  }
}
</script>

<template>
  <LayoutHeader title="SSO Config" icon="di-icon-sso">
    <div class="ml-auto d-flex align-items-center">
      <SearchInput class="search-input" hint-text="Search SSO name" @onTextChanged="handleKeyWordChange" :timeBound="300" />
      <DiIconTextButton id="refresh" class="ml-1 my-auto" title="Refresh" @click="handleRefresh">
        <i class="di-icon-reset" />
      </DiIconTextButton>
      <DiIconTextButton id="add" class="ml-1 my-auto" title="Add" @click="handleAdd">
        <i class="di-icon-add" />
      </DiIconTextButton>
    </div>
  </LayoutHeader>
</template>

<style scoped lang="scss"></style>
