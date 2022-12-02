<template>
  <div class="dashboard-detail-screen dashboard-theme">
    <template v-if="!(isFullScreen || isTVMode)">
      <transition mode="out-in" name="header-fade">
        <HeaderBar :showLogout="isLogin" />
      </transition>
    </template>
    <vuescroll :ops="dashboardScrollConfigs" @handle-scroll="onScrollDashboard">
      <div :class="dashboardPaddingClass" class="dashboard-area">
        <header ref="actionBar" class="header-sticky">
          <DashboardHeader ref="dashboardHeader" :enableFilter="hasWidget" :isLogin="isLogin" />
        </header>
        <StatusWidget :class="statusClass" :error="errorMessage" :status="dashboardStatus" class="dashboard-status" @retry="loadDashboard">
          <template #loading>
            <div class="d-flex flex-row align-items-center justify-content-center status-loading">
              <DiLoading></DiLoading>
            </div>
          </template>
          <template #error="{ error , onRetry}">
            <div class="error-panel">
              <ErrorWidget :error="error" @onRetry="onRetry"></ErrorWidget>
            </div>
          </template>
          <template #default>
            <Dashboard v-if="hasWidget" :style="dashboardStyle" ref="dashboard" />
            <EmptyDashboard v-else class="empty-dashboard" />
          </template>
        </StatusWidget>
      </div>
    </vuescroll>
    <template>
      <ContextMenu ref="contextMenu" :ignoreOutsideClass="['di-popup']" minWidth="200px" maxHeight="400px" textColor="#fff" />
      <EditTextModal ref="editTextModal" @onCreateText="handleCreateText" @onEditText="handleEditText" />
      <DiShareModal ref="shareModal" />
      <WidgetFullScreenModal ref="widgetFullScreenModal"></WidgetFullScreenModal>
      <ChartBuilderComponent ref="chartBuilderComponent"></ChartBuilderComponent>
      <BoostContextMenu ref="boostContextMenu" />
      <AddChartModal ref="addChartModal"></AddChartModal>
      <WidgetSettingModal ref="widgetSettingModal"></WidgetSettingModal>
      <SortModal ref="sortModal"></SortModal>
      <PasswordModal ref="passwordModal" />
    </template>
  </div>
</template>

<script lang="ts" src="./DashboardDetail.ts" />

<style lang="scss" src="./DashboardDetail.scss"></style>
<style lang="scss" src="./DashboardTheme.scss"></style>
<style lang="scss" src="./DashboardPopoverTheme.scss"></style>
