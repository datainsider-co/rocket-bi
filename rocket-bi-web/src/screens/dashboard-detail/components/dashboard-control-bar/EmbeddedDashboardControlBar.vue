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
    <div v-if="dashboardId" class="d-flex">
      <DiIconTextButton v-if="showResetFilters" :id="genBtnId('reset-filter')" title="Reset Filters" @click="resetFilter">
        <i class="di-icon-reset icon-title"></i>
      </DiIconTextButton>
      <SelectFieldButton id="add-filter" :dashboardId="dashboardId" title="Add Filter">
        <template #icon>
          <i class="di-icon-filter icon-title"></i>
        </template>
      </SelectFieldButton>
    </div>
    <!--    <transition mode="out-in" name="fade">-->
    <!--      &lt;!&ndash;      View Mode&ndash;&gt;-->
    <!--      <div key="view" class="view-action-bar">-->
    <!--        <DiIconTextButton :id="genBtnId('fullscreen')" title="Full screen" @click="switchMode('to_full_screen')">-->
    <!--          <i class="di-icon-full-screen icon-title"></i>-->
    <!--        </DiIconTextButton>-->
    <!--        <DiIconTextButton :id="genBtnId('tv-mode')" :title="'TV mode'" @click="switchMode('to_tv_mode')">-->
    <!--          <i class="di-icon-tv-mode icon-title"></i>-->
    <!--        </DiIconTextButton>-->
    <!--        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*']">-->
    <!--          <DiIconTextButton :id="genBtnId('share')" title="Share" @click="clickShare">-->
    <!--            <i class="di-icon-share icon-title"></i>-->
    <!--          </DiIconTextButton>-->
    <!--        </PermissionWidget>-->
    <!--        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'edit']">-->
    <!--          <DiIconTextButton :id="genBtnId('edit-mode')" title="Edit" @click="switchMode('to_edit')">-->
    <!--            <i class="di-icon-edit icon-title"></i>-->
    <!--          </DiIconTextButton>-->
    <!--        </PermissionWidget>-->
    <!--      </div>-->
    <!--      FullScreen-->
    <!--      <div-->
    <!--        v-else-if="isFullScreen || isTVMode"-->
    <!--        :id="genBtnId('exit-fullscreen')"-->
    <!--        key="full-screen"-->
    <!--        class="ic-exit-fullscreen btn-icon-border"-->
    <!--        @click="switchMode('to_view')"-->
    <!--      >-->
    <!--        <i class="di-icon-exit-full-screen"></i>-->
    <!--      </div>-->
    <!--      Edit Mode-->
    <!--      <div v-else key="edit" class="edit-action-bar">-->
    <!--        <PermissionWidget :actionTypes="actionTypes" :allowed-actions="['*', 'create']">-->
    <!--          <DiIconTextButton :id="genBtnId('adding-chart')" class="di-popup" title="Adding" @click.prevent="clickAdding">-->
    <!--            <i class="di-icon-add di-popup icon-title"></i>-->
    <!--          </DiIconTextButton>-->
    <!--        </PermissionWidget>-->
    <!--        <DiIconTextButton :id="genBtnId('setting-dashboard')" title="Settings" @click="showDashboardSetting">-->
    <!--          <i class="di-icon-setting icon-title"></i>-->
    <!--        </DiIconTextButton>-->
    <!--        <DiIconTextButton :id="genBtnId('save')" title="Save" @click="switchMode('to_view')">-->
    <!--          <i class="di-icon-save icon-title"></i>-->
    <!--        </DiIconTextButton>-->
    <!--      </div>-->
    <!--    </transition>-->
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
  </div>
</template>

<script lang="ts" src="./EmbeddedDashboardControlBar.ts" />

<style lang="scss" src="./DashboardControlBar.scss"></style>
