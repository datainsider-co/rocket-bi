<template>
  <div class="d-flex flex-column mt-2 text-uppercase">
    <b-input
      :id="genInputId('search-share-with-people-and-group')"
      v-model="searchInput"
      class="p-3 h-42px"
      debounce="300"
      placeholder="Add people and groups"
      variant="dark"
    ></b-input>
    <UserItemListing
      :data="suggestedUsers"
      :error="suggestUserError"
      :is-show-popover.sync="isShowPopover"
      :status="getSuggestUserStatus"
      :target="genInputId('search-share-with-people-and-group')"
      @handleClickUserItem="handleClickUserItem"
    ></UserItemListing>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { UserProfile } from '@core/common/domain';
import { ShareModule } from '@/store/modules/ShareStore';
import { Status } from '@/shared';
import { Log } from '@core/utils';

@Component({ components: { UserItemListing } })
export default class SearchUserInput extends Vue {
  private searchInput = '';
  private suggestUserError = '';
  private isShowPopover = false;

  getSuggestUserStatus: Status = Status.Loaded;

  get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  private handleClickUserItem(user: UserProfile) {
    this.$emit('select', user);
  }

  @Watch('searchInput')
  handleSearchInputChange(newValue: string) {
    if (newValue.trim() !== '') {
      this.isShowPopover = true;
      this.handleGetSuggestedUsers();
    } else {
      this.isShowPopover = false;
    }
  }

  private handleGetSuggestedUsers() {
    //todo: refactor fixed value
    this.getSuggestUserStatus = Status.Loading;
    ShareModule.getSuggestedUsers({ keyword: this.searchInput, from: 0, size: 100 })
      .then(() => {
        this.getSuggestUserStatus = Status.Loaded;
      })
      .catch(err => {
        this.getSuggestUserStatus = Status.Error;
        this.suggestUserError = err.message;
        Log.debug('DiShareModal::handleGetSuggestedUsers::err::', err);
      });
    Log.debug('DiShareModal::handleGetSuggestedUsers::suggestedUsers::', ShareModule.suggestedUsers);
  }

  reset() {
    this.searchInput = '';
  }
}
</script>

<style lang="scss" scoped></style>
