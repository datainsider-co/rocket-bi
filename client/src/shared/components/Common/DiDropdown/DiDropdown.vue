<!-- eslint-disable max-len -->
<template>
  <div class="select-container" :class="{ open: isDropdownOpen }" :title="label || placeholder">
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
                v-model="keyword"
                class="dropdown-input-search"
                :class="inputClass"
                autocomplete="off"
                @focus="showDropdown"
                @keydown="handleKeywordChanged"
                @keydown.enter="handleSelectItem"
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
                <img alt="dropdown" src="@/assets/icon/ic-16-arrow-down.svg" />
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
                        <svg height="16" viewBox="0 0 16 16" width="16">
                          <g fill="none" fill-rule="evenodd">
                            <path d="M0 0H16V16H0z" />
                            <path
                              d="M12.293 4.293L6 10.586 3.707 8.293c-.392-.379-1.016-.374-1.402.012-.386.386-.391 1.01-.012 1.402l3 3c.39.39 1.024.39 1.414 0l7-7c.379-.392.374-1.016-.012-1.402-.386-.386-1.01-.391-1.402-.012z"
                              fill="#597FFF"
                              fill-rule="nonzero"
                            />
                          </g>
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

<script lang="ts" src="./DiDropdown.ts"></script>
<style lang="scss" src="./di-dropdown.scss"></style>
