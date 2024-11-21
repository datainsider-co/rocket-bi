<template>
  <div class="dashboard-detail-screen" :style="dashboardCssStyle">
    <header ref="headerBar" class="dashboard-detail-screen--header">
      <DashboardHeader
        class="dashboard-detail-screen--header--dashboard"
        ref="dashboardHeader"
        :enableFilter="hasWidget"
        :isLogin="isLogin"
        :isMobile="isMobile"
        isEmbeddedView
      />
    </header>
    <div ref="dashboardBody" class="dashboard-detail-screen--body" @scroll="onScrollDashboard">
      <div class="dashboard--content" :image-fit-mode="dashboardSetting.backgroundImage.fitMode" ref="dashboardContent">
        <div v-if="dashboardStatus === Status.Loading" class="dashboard--content--loading">
          <DiLoading></DiLoading>
        </div>
        <div v-else-if="dashboardStatus === Status.Error" class="dashboard--content--error">
          <ErrorWidget :error="errorMsg" @onRetry="loadDashboard"></ErrorWidget>
        </div>
        <div v-else class="dashboard--content--loaded">
          <Dashboard v-if="hasWidget" class="dashboard--content--loaded--body" ref="dashboard" />
          <EmptyDashboard v-else class="dashboard--content--loaded--empty" />
        </div>
        <div v-show="isEditMode" ref="settingButton" class="dashboard--content--setting" title="Setting Dashboard" @click="onClickDashboardSetting">
          <i class="di-icon-setting"></i>
        </div>
      </div>
    </div>
    <template>
      <PasswordModal ref="passwordModal" />
    </template>
  </div>
</template>

<script lang="ts" src="./DashboardDetail.ts" />

<style lang="scss" src="./DashboardDetail.scss"></style>
