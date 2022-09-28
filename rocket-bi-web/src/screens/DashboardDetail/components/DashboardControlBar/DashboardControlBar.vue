<template>
  <div class="dashboard-control-bar">
    <div v-if="dashboardId">
      <MainDateFilter
        class="btn-ghost"
        v-if="isShowMainDateFilter"
        :class="getHiddenClass"
        :defaultDateRange="defaultDateRange"
        :canEditMainDateFilter="isEditDashboardMode"
        :mainDateFilterMode="mainDateFilterMode"
      />
      <SetupMainDateFilter
        v-else-if="isEditDashboardMode"
        :class="getHiddenClass"
        :isResetMainDateFilter="isResetMainDateFilter"
        @handle-setup-main-date-filter="handleSetupMainDateFilter"
        @handle-clear-reset-main-date="handleClearResetMainDate"
      />
    </div>
    <div v-if="dashboardId && !isMobile()" class="d-flex">
      <DiIconTextButton v-if="showResetFilters" :id="genBtnId('reset-filter')" title="Reset Filters" @click="resetFilter">
        <i class="di-icon-reset icon-title"></i>
      </DiIconTextButton>
      <SelectFieldButton id="add-filter" :dashboardId="dashboardId" :is-show-reset-filter-button="showResetFilters" title="Add Filter">
        <template #icon>
          <i class="di-icon-filter icon-title"></i>
        </template>
      </SelectFieldButton>
    </div>
    <transition mode="out-in" name="fade">
      <!--      View Mode-->
      <div v-if="isViewMode" key="view" class="view-action-bar">
        <template v-if="!isMobile()">
          <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*']">
            <DiIconTextButton :id="genBtnId('performance-boost')" :disabled="!boostEnable" title="Boost:" @click.prevent="showBoostMenu">
              <i class="di-icon-boost di-popup icon-title"></i>
              <template #suffix-content>
                <span v-if="boostEnable" id="boost-label" :class="{ 'di-disable': !boostEnable }">On</span>
                <span v-else id="boost-label" :class="{ 'di-disable': !boostEnable }">Off</span>
              </template>
            </DiIconTextButton>
          </PermissionWidget>
        </template>

        <DiIconTextButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiIconTextButton>
        <PermissionWidget v-if="!isMobile()" :actionTypes="actionTypes" :allowed-actions="['*', 'edit']">
          <DiIconTextButton :id="genBtnId('edit-mode')" title="Edit" @click="switchMode('to_edit')">
            <i class="di-icon-edit icon-title"></i>
          </DiIconTextButton>
        </PermissionWidget>
      </div>
      <!--      FullScreen-->
      <div v-else-if="isFullScreen || isTVMode" class="view-action-bar">
        <DiIconTextButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiIconTextButton>
        <div :id="genBtnId('exit-fullscreen')" key="full-screen" class="ic-exit-fullscreen btn-icon-border" @click="switchMode('to_view')">
          <i class="di-icon-exit-full-screen"></i>
        </div>
      </div>
      <!--      Edit Mode-->
      <div v-else-if="isEditDashboardMode" key="edit" class="edit-action-bar">
        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'create']">
          <DiIconTextButton :id="genBtnId('adding-chart')" class="di-popup" title="Adding" @click.prevent="clickAdding">
            <i class="di-icon-add di-popup icon-title"></i>
          </DiIconTextButton>
        </PermissionWidget>
        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'create']">
          <DiIconTextButton :id="genBtnId('performance-boost')" title="Boost:" @click.prevent="clickBoost">
            <i class="di-icon-boost di-popup icon-title"></i>
            <template #suffix-content>
              <span v-if="boostEnable" id="boost-label">On</span>
              <span v-else id="boost-label">Off</span>
            </template>
          </DiIconTextButton>
        </PermissionWidget>
        <DiIconTextButton ref="optionButton" :id="optionButtonId" tabindex="-1" title="Options" @click="openOptionMenu">
          <i class="di-icon-option icon-title"></i>
        </DiIconTextButton>
        <DiIconTextButton :id="genBtnId('save')" title="Save" @click="switchMode('to_view')">
          <i class="di-icon-save icon-title"></i>
        </DiIconTextButton>
      </div>
      <!--      RLS View Mode-->
      <div class="d-flex align-items-center" v-else-if="isRLSViewAsMode">
        <div v-if="viewAsUser" :title="viewAsUser.email">
          <DiIconTextButton class="rls-view-as" border :id="genBtnId('rls-setting-view-as')" @click="showRLSViewAsModal">
            <div class="d-flex align-items-center">
              <i class="di-icon-view-as icon-title mr-2"></i>
              <div class="d-flex align-items-center">
                View As:
                <div class="font-weight-semi-bold ml-2">{{ userDisplayName(viewAsUser) }}</div>
              </div>
            </div>
          </DiIconTextButton>
        </div>

        <DiIconTextButton :id="genBtnId('rls-exit-view-as')" class="ml-1" title="Exit View As" @click="exitRLSViewAs">
          <i class="di-icon-exit-view-as icon-title"></i>
        </DiIconTextButton>
      </div>
    </transition>
    <template>
      <input
        :id="genInputId('image-picker')"
        ref="imagePicker"
        accept="image/*"
        class="form-control-file"
        style="display: none !important;"
        type="file"
        @change="handleFileSelected"
      />
      <DashboardSettingModal ref="dashboardSettingModal" />
    </template>
    <PerformanceBoostModal ref="performanceBoostModal" />
    <RelationshipModal ref="relationshipModal"></RelationshipModal>

    <!--Option Menu-->
    <BPopover
      ref="menuOption"
      :show.sync="isShowOptionMenu"
      custom-class="custom-option-menu-popover"
      :id="optionMenuId"
      :target="optionButtonId"
      :placement="optionMenuPlacement"
      boundary="viewport"
      triggers="blur click"
    >
      <div v-click-outside="hideOptionMenu">
        <div>
          <DiIconTextButton :id="genBtnId('data-relationship')" title="Relationship" @click="openRelationshipModal">
            <DashboardRelationshipIcon />
          </DiIconTextButton>
        </div>
        <!--Edit Mode Options-->
        <div v-if="isEditDashboardMode">
          <!--Setting-->
          <DiIconTextButton :id="genBtnId('setting-dashboard')" title="Settings" @click="showDashboardSetting">
            <i class="di-icon-setting icon-title"></i>
          </DiIconTextButton>
        </div>
        <!--View Mode Options-->
        <div v-else-if="isViewMode">
          <!--FullScreen Option-->
          <DiIconTextButton :id="genBtnId('fullscreen')" title="Full screen" @click="switchMode('to_full_screen')">
            <i class="di-icon-full-screen icon-title"></i>
          </DiIconTextButton>

          <!--TVMode Option-->
          <DiIconTextButton :id="genBtnId('tv-mode')" :title="'TV mode'" @click="switchMode('to_tv_mode')">
            <i class="di-icon-tv-mode icon-title"></i>
          </DiIconTextButton>

          <!--Share Option-->
          <PermissionWidget v-if="!isMobile()" :actionTypes="actionTypes" :allowed-actions="['*']">
            <DiIconTextButton :id="genBtnId('share')" title="Share" @click="clickShare">
              <i class="di-icon-share icon-title"></i>
            </DiIconTextButton>
          </PermissionWidget>

          <!--Switch to ViewAs-->
          <DiIconTextButton :id="genBtnId('rls-view-as')" title="View As" @click="clickViewAs">
            <i class="di-icon-view-as icon-title"></i>
          </DiIconTextButton>
        </div>
        <div v-else-if="isFullScreen || isFullScreen">
          <!--Share Option-->
          <PermissionWidget v-if="!isMobile()" :actionTypes="actionTypes" :allowed-actions="['*']">
            <DiIconTextButton :id="genBtnId('share')" title="Share" @click="clickShare">
              <i class="di-icon-share icon-title"></i>
            </DiIconTextButton>
          </PermissionWidget>
        </div>
      </div>
    </BPopover>
    <RLSViewAsModal ref="rlsViewAsModal"></RLSViewAsModal>
  </div>
</template>

<script lang="ts" src="./DashboardControlBar.ts" />

<style lang="scss" src="./dashboard-control-bar.scss"></style>
