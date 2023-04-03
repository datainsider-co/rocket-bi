<template>
  <div class="embedded-dashboard-detail-screen dashboard-theme">
    <vuescroll :ops="dashboardScrollConfigs" @handle-scroll="onScrollDashboard">
      <div :class="dashboardPaddingClass" class="dashboard-area">
        <header ref="actionBar" class="header-sticky">
          <EmbeddedDashboardHeader ref="dashboardHeader" :enableFilter="hasWidget" :isLogin="isLogin" />
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
            <Dashboard v-if="hasWidget" :style="dashboardStyle" />
            <EmptyDashboard v-else class="empty-dashboard" />
          </template>
        </StatusWidget>
      </div>
    </vuescroll>
    <div class="embed-footer">Powered By <a target="_blank" href="https://www.datainsider.co/">DataInsider.co</a></div>
    <template>
      <ContextMenu ref="contextMenu" :ignoreOutsideClass="['di-popup']" minWidth="200px" textColor="#fff" />
      <EditTextModal ref="editTextModal" @onCreateText="handleCreateText" @onEditText="handleEditText" />
      <DiShareModal ref="shareModal" />
      <WidgetFullScreenModal ref="widgetFullScreenModal"></WidgetFullScreenModal>
      <ChartBuilderComponent ref="chartBuilderComponent"></ChartBuilderComponent>
      <PasswordModal ref="passwordModal" />
    </template>
  </div>
</template>

<script lang="ts" src="./EmbeddedDashboard.ts" />

<style lang="scss" src="./EmbeddedDashboardDetail.scss"></style>
<style lang="scss" src="./DashboardTheme.scss"></style>
<style lang="scss" src="./DashboardPopoverTheme.scss"></style>
