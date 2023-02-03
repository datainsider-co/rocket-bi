<template>
  <DiCustomModal
    hide-header-close
    id="rls-view-as-modal"
    ref="modal"
    title="View As"
    ok-title="Apply"
    @hidden="reset"
    :ok-disabled="!isValidForm"
    @onClickOk="handleSubmit"
  >
    <div class="rls-view-as-container">
      <label>Select user</label>
      <b-input
        :id="genInputId('search-user-view-as')"
        v-model="searchUserKeyword"
        class="p-3 h-42px"
        debounce="300"
        autofocus
        placeholder="Select user..."
        variant="dark"
      ></b-input>
      <UserItemListing
        :data="suggestedUsers"
        :error="suggestUserError"
        :is-show-popover.sync="isShowUserSuggestionPopover"
        :status="getSuggestUserStatus"
        :target="genInputId('search-user-view-as')"
        @handleClickUserItem="handleSelectUserItem"
      ></UserItemListing>

      <div v-if="user">
        <UserItem class="selected-user" :user-data="user"></UserItem>
        <ChipListing class="attribute-listing" :listChipData="attributesAsChipInfos" />
      </div>
    </div>
  </DiCustomModal>
</template>
<script lang="ts">
import { Component, Ref, Vue, Watch } from 'vue-property-decorator';
import DiCustomModal from '@/shared/components/DiCustomModal.vue';
import { UserProfile } from '@core/common/domain';
import { ShareModule } from '@/store/modules/ShareStore';
import { Status } from '@/shared';
import { Log } from '@core/utils';
import UserItem from '@/shared/components/UserItem.vue';
import ChipListing, { ChipData } from '@/shared/components/ChipListing.vue';
import { StringUtils } from '@/utils/StringUtils';

type ViewAsCallback = (user: UserProfile) => void;

@Component({
  components: { ChipListing, UserItem, DiCustomModal }
})
export default class RLSViewAsModal extends Vue {
  private user: UserProfile | null = null;
  private searchUserKeyword = '';
  private callback: ViewAsCallback | null = null;
  private suggestUserError = '';
  private isShowUserSuggestionPopover = false;
  private getSuggestUserStatus: Status = Status.Loaded;

  @Ref()
  private readonly modal!: DiCustomModal;

  private get isValidForm() {
    return this.user ? true : false;
  }

  private get suggestedUsers(): UserProfile[] {
    return ShareModule.suggestedUsers;
  }

  private get attributesAsChipInfos(): ChipData[] {
    const result: ChipData[] = [];
    if (this.user) {
      for (const key in this.user.properties) {
        result.push({
          title: `${StringUtils.toSnakeCase(key)} = ${this.user.properties[key]}`,
          isShowRemove: false
        });
      }
    }
    return result;
  }

  show(callback?: ViewAsCallback) {
    if (callback) {
      this.callback = callback;
    }
    this.modal.show();
  }

  hide() {
    this.modal.hide();
    //
  }

  reset() {
    // this.user = null;
    this.searchUserKeyword = '';
    this.callback = null;
    // this.suggestUserError = '';
    // this.isShowUserSuggestionPopover = false;
    // this.getSuggestUserStatus = Status.Loaded;
  }

  private handleSelectUserItem(userProfile: UserProfile) {
    this.user = userProfile;
  }

  private handleSubmit(e: Event) {
    try {
      if (this.isValidForm && this.callback) {
        this.callback(this.user!);
      }
    } catch (e) {
      Log.error('RLSViewAsModal::handleSubmit::error::', e.message);
    }
  }

  @Watch('searchUserKeyword')
  handleSearchInputChange(newValue: string) {
    if (newValue.trim() !== '') {
      this.isShowUserSuggestionPopover = true;
      this.handleGetSuggestedUsers();
    } else {
      this.isShowUserSuggestionPopover = false;
    }
  }

  private handleGetSuggestedUsers() {
    this.getSuggestUserStatus = Status.Loading;
    ShareModule.loadSuggestedUsers({ keyword: this.searchUserKeyword, from: 0, size: 100 })
      .then(() => {
        this.getSuggestUserStatus = Status.Loaded;
      })
      .catch(err => {
        this.getSuggestUserStatus = Status.Error;
        this.suggestUserError = err.message;
        Log.debug('UserActivityHeader::handleGetSuggestedUsers::err::', err);
      });
    Log.debug('UserActivityHeader::handleGetSuggestedUsers::suggestedUsers::', ShareModule.suggestedUsers);
  }
}
</script>

<style lang="scss">
#rls-view-as-modal {
  .modal-dialog {
    max-width: 560px;
  }

  .selected-user {
    margin: 16px 0;
  }

  .attribute-listing {
    .chip-area {
      height: 20px;
      margin-top: 4px;
    }
  }

  .rls-view-as-container {
    label {
      line-height: 1;
      margin-bottom: 12px;
    }
  }
}
</style>
