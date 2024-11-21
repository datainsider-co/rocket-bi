<!--<template>-->
<!--  <CollapseTransition>-->
<!--    <b-container v-if="isCollapsed" v-bind:key="'collapsed'" class="p-md-0 pad-y-15">-->
<!--      <div class="d-flex flex-column mt-2 text-uppercase">-->
<!--        <b-input-->
<!--          :id="genInputId('search-share-with-people-and-group')"-->
<!--          v-model="searchInput"-->
<!--          class="p-3 h-42px"-->
<!--          debounce="300"-->
<!--          placeholder="Add people and groups"-->
<!--          variant="dark"-->
<!--        ></b-input>-->
<!--        <UserItemListing-->
<!--          :data="suggestedUsers"-->
<!--          :error="suggestUserError"-->
<!--          :is-show-popover.sync="isShowPopover"-->
<!--          :status="getSuggestUserStatus"-->
<!--          :target="genInputId('search-share-with-people-and-group')"-->
<!--          @handleClickUserItem="handleClickUserItem"-->
<!--        ></UserItemListing>-->
<!--      </div>-->
<!--      <StatusWidget :error="getSharedUserError" :status="getSharedUserStatus"></StatusWidget>-->
<!--      <UserItemStatusListing-->
<!--        v-if="isGetSharedUserLoaded"-->
<!--        :data="resourceInfo.usersSharing"-->
<!--        :organizationId="organizationId"-->
<!--        :owner="resourceInfo.owner"-->
<!--        :resource-id="resourceId"-->
<!--        :resource-type="resourceType"-->
<!--        :status-data="swmStatusData"-->
<!--        @handleItemStatusChange="handleSharePermissionChange"-->
<!--      ></UserItemStatusListing>-->
<!--      <div class="row divider-top" />-->
<!--      <div class="d-flex mb-2 mb-sm-4">-->
<!--        <b-button :id="genBtnId('share-cancel')" class="flex-fill h-42px m-1" variant="secondary" @click="cancel" event="share_cancel">-->
<!--          Cancel-->
<!--        </b-button>-->
<!--        <b-button :id="genBtnId('share-done')" class="flex-fill h-42px m-1" variant="primary" @click="ok">-->
<!--          Apply-->
<!--        </b-button>-->
<!--      </div>-->
<!--    </b-container>-->
<!--  </CollapseTransition>-->
<!--</template>-->

<!--<script lang="ts">-->
<!--import { Component, Vue, Prop } from 'vue-property-decorator';-->
<!--import { UserProfile } from '@core/common/domain';-->
<!--import { ShareModule } from '@/store/modules/ShareStore';-->
<!--import UserItemListing from '@/shared/components/UserItemListing.vue';-->
<!--import { Status } from '@/shared';-->
<!--import { Track } from '@/shared/anotation';-->
<!--import { TrackEvents } from '@core/tracking/enum/TrackEvents';-->
<!--import { Log } from '@core/utils';-->
<!--import { ShareHandler } from '@/shared/components/common/di-share-modal/share-handler/ShareHandler';-->
<!--import { ResourceData } from '@/shared/components/common/di-share-modal/DiShareModal.vue';-->

<!--@Component({ components: { UserItemListing } })-->
<!--export default class ShareUser extends Vue {-->
<!--  @Prop({ required: true })-->
<!--  private shareHandler!: ShareHandler;-->

<!--  @Prop({ required: true })-->
<!--  private resourceData!: ResourceData;-->
<!--  private isCollapsed = false;-->
<!--  private isShowPopover = false;-->

<!--  private searchInput = '';-->

<!--  private suggestUserError = '';-->

<!--  private getSuggestUserStatus: Status = Status.Loaded;-->

<!--  private organizationId = '';-->

<!--  expand(enable: boolean) {-->
<!--    this.isCollapsed = !enable;-->
<!--  }-->

<!--  get suggestedUsers(): UserProfile[] {-->
<!--    return ShareModule.suggestedUsers;-->
<!--  }-->

<!--  @Track(TrackEvents.SelectShareUser, {-->
<!--    username: (_: ShareUser, args: any) => args[0].username,-->
<!--    user_email: (_: ShareUser, args: any) => args[0].email,-->
<!--    resource_type: (_: ShareUser, args: any) => args[0].resourceType,-->
<!--    resource_id: (_: ShareUser, args: any) => args[0].resourceId-->
<!--  })-->
<!--  private handleClickUserItem(userItemData: UserProfile) {-->
<!--    Log.debug('DiShare::handleClickUserItem::data', userItemData);-->
<!--    //todo: add new userItem to ShareStore-->
<!--    this.shareHandler.addShareUser(this.organizationId, this.resourceData.resourceType, `${this.resourceData.resourceId}`, userItemData);-->
<!--  }-->
<!--}-->
<!--</script>-->

<!--<style lang="scss" scoped></style>-->
