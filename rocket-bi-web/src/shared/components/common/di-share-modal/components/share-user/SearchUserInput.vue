<template>
  <div class="d-flex flex-column mt-2 text-uppercase">
    <BInput
      :id="genInputId('search-share-with-people-and-group')"
      ref="input"
      v-model="searchInput"
      class="p-3 h-42px"
      debounce="500"
      autocomplete="off"
      :placeholder="placeholder"
      variant="dark"
      @focus="handleOnFocus"
    />
    <UserItemListing
      :data="suggestedUsers"
      :error="suggestUserError"
      :is-show-popover.sync="isShowPopover"
      :status="getSuggestUserStatus"
      :target="genInputId('search-share-with-people-and-group')"
      :is-show-empty-data="!isEmptySearchInput"
      @handleClickUserItem="handleClickUserItem"
    ></UserItemListing>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator';
import UserItemListing from '@/shared/components/UserItemListing.vue';
import { UserProfile } from '@core/common/domain';
import { ShareModule } from '@/store/modules/ShareStore';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import { ListUtils, StringUtils } from '@/utils';

@Component({ components: { UserItemListing } })
export default class SearchUserInput extends Vue {
  private searchInput = '';
  private suggestUserError = '';
  private isShowPopover = false;

  getSuggestUserStatus: Status = Status.Loaded;

  @Ref()
  input!: HTMLInputElement;

  @Prop({ required: false, default: 'Input' })
  placeholder!: string;

  get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  public get inputValue() {
    return this.searchInput;
  }

  private get isEmptySearchInput() {
    return StringUtils.isEmpty(this.searchInput);
  }

  private handleClickUserItem(user: UserProfile) {
    this.$emit('select', user);
    this.isShowPopover = false;
  }

  mounted() {
    if (ListUtils.isEmpty(this.suggestedUsers)) {
      this.handleGetSuggestedUsers();
    }
  }

  @Watch('searchInput')
  handleSearchInputChange(newValue: string) {
    this.isShowPopover = true;
    this.handleGetSuggestedUsers();
  }

  private handleOnFocus() {
    if (!this.isShowPopover) {
      this.isShowPopover = true;
    }
  }

  public unFocus() {
    this.isShowPopover = false;
    this.input.blur();
  }

  private handleGetSuggestedUsers() {
    //todo: refactor fixed value
    this.getSuggestUserStatus = Status.Loading;
    ShareModule.loadSuggestedUsers({ keyword: this.searchInput, from: 0, size: 100 })
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

  setInputValue(value: string) {
    this.searchInput = value;
  }
}
</script>
