<template>
  <div
    :class="{
      'dashboard-control-bar': true,
      'dashboard-control-bar--mobile': isMobile
    }"
  >
    <div v-if="dashboardId">
      <MainDateFilter
        v-if="hasMainDate"
        class="btn-ghost"
        :class="getHiddenClass"
        :defaultDateRange="defaultDateRange"
        :canEditMainDateFilter="isEditMode"
        :mainDateFilterMode="mainDateFilterMode"
      />
      <SetupMainDateFilter
        v-else-if="isEditMode && !isEmbeddedView"
        :class="getHiddenClass"
        :isResetMainDateFilter="isResetMainDateFlow"
        @handle-setup-main-date-filter="handleSetupMainDateFilter"
        @handle-clear-reset-main-date="handleClearResetMainDate"
      />
    </div>
    <div v-if="dashboardId && !isMobile" class="d-flex">
      <DiButton v-if="showResetFilters" :id="genBtnId('reset-filter')" title="Reset Filters" @click="resetFilter">
        <i class="di-icon-reset icon-title"></i>
      </DiButton>
      <!--      <SelectFieldButton id="add-filter" :dashboardId="dashboardId" :is-show-reset-filter-button="showResetFilters" title="Add Filter">-->
      <!--        <template #icon>-->
      <!--          <i class="di-icon-filter icon-title"></i>-->
      <!--        </template>-->
      <!--      </SelectFieldButton>-->
    </div>
    <transition mode="out-in" name="fade" v-if="!isEmbeddedView">
      <!--      View Mode-->
      <div v-if="isViewMode" key="view" class="view-action-bar">
        <DiButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiButton>
        <PermissionWidget v-if="!isMobile" :actionTypes="actionTypes" :allowed-actions="['*', 'edit']">
          <DiButton :id="genBtnId('edit-mode')" title="Edit" @click="toEditMode">
            <i class="di-icon-edit icon-title"></i>
          </DiButton>
        </PermissionWidget>
      </div>
      <!--      FullScreen-->
      <div v-else-if="isFullScreen || isTVMode" class="view-action-bar">
        <DiButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiButton>
        <div :id="genBtnId('exit-fullscreen')" key="full-screen" class="ic-exit-fullscreen btn-icon-border mar-r-4" @click="toViewMode">
          <i class="di-icon-exit-full-screen"></i>
        </div>
      </div>
      <!--      Edit Mode-->
      <div v-else-if="isEditMode" key="edit" class="edit-action-bar">
        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'create']">
          <DiButton :id="genBtnId('adding-chart')" class="di-popup" title="Adding" @click.prevent="clickAdding">
            <i class="di-icon-add di-popup icon-title"></i>
          </DiButton>
        </PermissionWidget>
        <!--        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'create']">-->
        <!--          <DiIconTextButton :id="genBtnId('performance-boost')" title="Boost:" @click.prevent="clickBoost">-->
        <!--            <i class="di-icon-boost di-popup icon-title"></i>-->
        <!--            <template #suffix-content>-->
        <!--              <span v-if="boostEnable" id="boost-label">On</span>-->
        <!--              <span v-else id="boost-label">Off</span>-->
        <!--            </template>-->
        <!--          </DiIconTextButton>-->
        <!--        </PermissionWidget>-->
        <DiButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiButton>
        <DiButton :id="genBtnId('save')" title="Save" @click="toViewMode">
          <i class="di-icon-save icon-title"></i>
        </DiButton>
      </div>
      <!--      RLS View Mode-->
      <div class="d-flex align-items-center" v-else-if="isRLSViewAsMode">
        <div v-if="viewAsUser" :title="viewAsUser.email">
          <DiButton class="rls-view-as" border :id="genBtnId('rls-setting-view-as')" @click="showRLSViewAsModal">
            <div class="d-flex align-items-center">
              <i class="di-icon-view-as icon-title mr-2"></i>
              <div class="d-flex align-items-center">
                View As:
                <div class="font-weight-semi-bold ml-2">{{ userDisplayName(viewAsUser) }}</div>
              </div>
            </div>
          </DiButton>
        </div>

        <DiButton :id="genBtnId('rls-exit-view-as')" class="ml-1" title="Exit View As" @click="exitRLSViewAs">
          <i class="di-icon-exit-view-as icon-title"></i>
        </DiButton>
      </div>
    </transition>
    <input
      :id="genInputId('image-picker')"
      ref="imagePicker"
      accept="image/*"
      class="form-control-file"
      style="display: none !important;"
      type="file"
      @change="handleFileSelected"
    />

    <!--Option Menu-->
    <BPopover
      ref="menuOption"
      id="dashboard-options-menu"
      custom-class="custom-option-menu-popover"
      boundary="viewport"
      placement="bottom"
      triggers="click"
      :show.sync="isShowOptionMenu"
      :target="optionButtonId"
    >
      <div v-click-outside="hideMenuOptions">
        <div>
          <DiButton align="left" :id="genBtnId('data-relationship')" title="Relationship" @click="openRelationshipModal">
            <DashboardRelationshipIcon />
          </DiButton>
        </div>
        <!--Edit Mode Options-->
        <div v-if="isEditMode">
          <!--Setting-->
          <DiButton align="left" :id="genBtnId('setting-dashboard')" title="Settings" @click="showDashboardSetting">
            <i class="di-icon-setting icon-title"></i>
          </DiButton>
        </div>
        <!--View Mode Options-->
        <div v-else-if="isViewMode">
          <!--FullScreen Option-->
          <DiButton align="left" :id="genBtnId('fullscreen')" title="Full screen" @click="toFullScreenMode">
            <i class="di-icon-full-screen icon-title"></i>
          </DiButton>

          <!--TVMode Option-->
          <DiButton align="left" :id="genBtnId('tv-mode')" :title="'TV mode'" @click="toTvMode">
            <i class="di-icon-tv-mode icon-title"></i>
          </DiButton>

          <!--Share Option-->
          <PermissionWidget v-if="!isMobile" :actionTypes="actionTypes" :allowed-actions="['*']">
            <DiButton align="left" :id="genBtnId('share')" title="Share" @click="clickShare">
              <i class="di-icon-share icon-title"></i>
            </DiButton>
          </PermissionWidget>

          <!--Switch to ViewAs-->
          <DiButton align="left" :id="genBtnId('rls-view-as')" title="View As" @click="clickViewAs">
            <i class="di-icon-view-as icon-title"></i>
          </DiButton>
        </div>
        <div v-else-if="isFullScreen || isFullScreen">
          <!--Share Option-->
          <PermissionWidget v-if="!isMobile" :actionTypes="actionTypes" :allowed-actions="['*']">
            <DiButton align="left" :id="genBtnId('share')" title="Share" @click="clickShare">
              <i class="di-icon-share icon-title"></i>
            </DiButton>
          </PermissionWidget>
        </div>
      </div>
    </BPopover>
    <DashboardSettingModal ref="dashboardSettingModal" />
    <PerformanceBoostModal ref="performanceBoostModal" />
    <RelationshipModal ref="relationshipModal"></RelationshipModal>
    <RLSViewAsModal ref="rlsViewAsModal"></RLSViewAsModal>
  </div>
</template>

<script lang="ts" src="./DashboardControlBar.ts" />

<style lang="scss" src="./DashboardControlBar.scss"></style>
