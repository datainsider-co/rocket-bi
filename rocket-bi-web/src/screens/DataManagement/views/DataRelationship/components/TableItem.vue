<template>
  <div class="table-item-container" :class="{ highlight: highlight }">
    <!--    <style>-->
    <!--      :root {-->
    <!--        &#45;&#45;ll-translate-x: {{ leaderLineTransform.x }};-->
    <!--        &#45;&#45;ll-translate-y: {{ leaderLineTransform.y }};-->
    <!--      }-->
    <!--    </style>-->
    <div class="database-name">
      <slot name="database-name"></slot>
    </div>
    <div class="table-item">
      <div class="table-name">
        <!--        <span v-if="table.displayName"> {{ table.displayName }} </span>-->
        <em v-if="table.name">{{ table.name }}</em>
        <div class="dropdown table-actions ml-2">
          <span v-if="loading" class="fa fa-spin fa-spinner"></span>
          <a v-else href="#" data-toggle="dropdown">
            <img src="@/assets/icon/charts/ic_more.svg" alt="" width="12" height="12" />
          </a>
          <div class="dropdown-menu dropdown-menu-right">
            <!--            <button :disabled="loading" @click.prevent="$emit('showAllRelationship', table)" class="dropdown-item">Show All Relationship</button>-->
            <button v-if="isShowHideTableOption" :disabled="loading" @click.prevent="removeTable(table)" class="dropdown-item">Hide table</button>
            <button :disabled="loading" @click.prevent="toggleCollapse" class="dropdown-item">
              <span v-if="collapsed">Expand</span>
              <span v-else>Collapse</span>
            </button>
          </div>
        </div>
      </div>
      <div class="table-columns" :class="{ collapsed: collapsed }">
        <a
          @dragstart="e => onDragStart(e, column)"
          @dragover="e => onDragOver(e, column)"
          @dragleave="e => onDragLeave(e, column)"
          @dragend="onDragEnd"
          @drag="onDrag"
          @drop="e => onDrop(e, column)"
          :id="getColumnElId(table, column)"
          draggable="true"
          v-for="column in table.columns"
          :key="column.name"
          @click.prevent
          href="#"
          class="table-columns-item"
          :class="{ active: hasConnection(column) }"
        >
          <component :is="getIcon(column)" class="table-columns-icon"></component>
          {{ column.displayName || column.name }}
        </a>
      </div>
    </div>
  </div>
</template>
<style lang="scss" src="./TableItem.style.scss"></style>
<script lang="ts" src="./TableItem.ctrl.ts"></script>
