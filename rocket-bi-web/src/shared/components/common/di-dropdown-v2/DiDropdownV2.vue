<!-- eslint-disable max-len -->
<template>
  <div class="select-container-v2" :class="{ open: isDropdownOpen }" :title="label || placeholder">
    <div v-click-outside="hideDropdown" class="relative">
      <span :id="dropdownButtonId" ref="dropdown">
        <slot :id="id" :disabled="disabled" :onToggleDropdown="toggleDropdown" :title="label || placeholder" name="dropdown-button">
          <button
            :id="id"
            :class="{ disabled: disabled }"
            :disabled="disabled"
            aria-expanded="true"
            aria-haspopup="listbox"
            aria-labelledby="listbox-label"
            type="button"
            @click.stop="toggleDropdown"
          >
            <div>
              <BInput
                ref="inputKeyword"
                name="di-dropdown"
                type="text"
                v-model="keyword"
                class="dropdown-input-search"
                :class="inputClass"
                autocomplete="new-di-dropdown"
                @focus="showDropdown"
                @keydown="handleKeywordChanged"
                @keydown.enter="handleSelectItem"
                @keydown.space="handleTypeWhitespace"
                @keydown.up="handleMoveUp"
                @keyup.down="handleMoveDown"
                @click.stop="showDropdown"
              />
              <!--              :debounce="500"-->
              <!--              :placeholder="label || placeholder"-->
              <div
                v-if="!keyword"
                :class="{
                  'dropdown-open': isDropdownOpen,
                  'text-muted': !label,
                  'default-label': selectedItem && selectedItem.isDefaultLabel,
                  'use-placeholder': !selectedItem && !!placeholder
                }"
                class="dropdown-input-placeholder"
              >
                <slot name="selected-item" v-bind="{ selectedItem, label, placeholder }">
                  {{ label || placeholder }}
                </slot>
              </div>
            </div>
            <span class="icon-dropdown">
              <slot name="icon-dropdown">
                <img alt="dropdown" src="@/assets/icon/down.svg" />
              </slot>
            </span>
          </button>
        </slot>
      </span>
      <BPopover
        :boundary="boundary"
        :container="selectId"
        :customClass="popoverClass"
        :show.sync="isDropdownOpen"
        :target="id"
        @shown="scrollToIndex(selectedIndex, false)"
        placement="bottom"
        triggers=""
      >
        <div :style="popoverStyle" class="select-popover" tabindex="-1">
          <slot name="popover-panel" :keyword="keyword">
            <vuescroll @handle-scroll="handleScroll" ref="scroller">
              <ul aria-labelledby="listbox-label" role="listbox" tabindex="-1">
                <slot name="before-menu" :hideDropdown="hideDropdown"></slot>
                <template v-if="!!keyword && finalOptions.length === 0">
                  <slot name="search-empty">
                    <li class="disable" role="option" tabindex="0">
                      <div>
                        <span class="unselectable block truncate font-normal">
                          Sorry, no matching options.
                        </span>
                      </div>
                    </li>
                  </slot>
                </template>
                <template v-else-if="isEmpty(finalOptions)">
                  <slot name="empty">
                    <li class="disable" role="option" tabindex="0">
                      <div>
                        <span class="unselectable block truncate font-normal">
                          {{ emptyPlaceholder }}
                        </span>
                      </div>
                    </li>
                  </slot>
                </template>
                <template v-else>
                  <template v-for="(item, index) in finalOptions">
                    <li
                      :id="genBtnId('dropdown', index)"
                      :key="index"
                      :class="{
                        active: canSelect(item),
                        disable: getValue(item) === '',
                        selected: index === selectedIndex
                      }"
                      role="option"
                      tabindex="0"
                      @click.prevent="select(item)"
                      :title="getLabel(item)"
                    >
                      <div>
                        <slot name="option-item" v-bind="{ item, isSelected, getLabel }">
                          <span class="block truncate unselectable" v-bind:class="{ 'font-normal': !isSelected(item), 'font-semibold': isSelected(item) }">
                            {{ getLabel(item) }}
                          </span>
                        </slot>
                      </div>
                      <span v-if="enableIconSelected && isSelected(item)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12L10 17L20 7" stroke="#4F4F4F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </span>
                    </li>
                  </template>
                </template>
                <!-- More options... -->
              </ul>
            </vuescroll>
          </slot>
        </div>
      </BPopover>
    </div>
  </div>
</template>

<script lang="ts" src="./DiDropdownV2.ts"></script>
<style lang="scss" src="./DiDropdownV2.scss"></style>
