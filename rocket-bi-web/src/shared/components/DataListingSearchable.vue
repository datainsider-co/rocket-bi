<template>
  <div class="field-listing-area">
    <div class="custom-search-input">
      <SearchInput :hintText="hintText" @onTextChanged="handleInputSearch" :timeBound="200" />
    </div>
    <div class="d-flex flex-row back-area btn-ghost align-items-center" :id="genBtnId('data-list-searchable-back')" v-if="canBack" @click.prevent="handleBack">
      <div>
        <b-icon-chevron-left></b-icon-chevron-left>
      </div>
      <div class="mr-auto unselectable col-11">
        {{ displayBackTitle }}
      </div>
    </div>
    <vuescroll :ops="scrollOption">
      <div class="custom-listing">
        <template v-if="haveOptions">
          <div
            v-for="(option, index) in filteredOptions"
            :key="index"
            :id="genBtnId('database', index)"
            @click="handleClickOption(option)"
            class="d-flex flex-row align-items-center data-item btn-ghost"
          >
            <div class="unselectable col-10">
              {{ option.displayName }}
            </div>
            <div class="ml-auto col-1">
              <b-icon-chevron-right></b-icon-chevron-right>
            </div>
          </div>
        </template>
        <div v-else>
          There are no records to show
        </div>
      </div>
    </vuescroll>
  </div>
</template>

<script lang="ts">
import { Component, Emit, Prop, Vue } from 'vue-property-decorator';
import { Config } from 'vuescroll';
import { VerticalScrollConfigs, SelectOption } from '@/shared';
import { ListUtils, SchemaUtils } from '@/utils';

@Component
export default class DataListingSearchable extends Vue {
  scrollOption: Config = VerticalScrollConfigs;
  @Prop({ required: true, type: Array })
  options!: SelectOption[];

  @Prop({ default: '', type: String })
  displayBackTitle!: string;

  @Prop({ default: false, type: Boolean })
  canBack!: boolean;

  @Prop({ default: false, type: String })
  hintText!: string;

  private searchString = '';

  private get filteredOptions(): SelectOption[] {
    return SchemaUtils.search(this.options, this.searchString);
  }

  @Emit('onClickOption')
  private handleClickOption(option: SelectOption) {
    return option;
  }

  @Emit('onClickBack')
  private handleBack(event: MouseEvent) {
    return event;
  }

  private handleInputSearch(text: string) {
    this.searchString = text;
  }

  private get haveOptions(): boolean {
    return ListUtils.isNotEmpty(this.filteredOptions);
  }
}
</script>

<style lang="scss" scoped>
@import '~@/themes/scss/mixin.scss';

.field-listing-area {
  .custom-search-input {
    display: flex;
    background-color: var(--input-background-color);
    padding: 0 15px;
    border-radius: 4px;
    //border: solid 1px var(--primaryColor);
    height: 40px;
  }

  .back-area {
    margin-top: 12px;
    @include bold-text-14();
    letter-spacing: 0.6px;
    padding: 12px 12px 12px 0;
  }

  .custom-listing {
    color: var(--text-color);
    font-size: 14px;
    margin-top: 16px;
    max-height: 445px;

    .data-item {
      @include regular-text();
      letter-spacing: 0.6px;
      padding: 12px;
      //background-color: var(--secondary);
    }

    > div + div {
      margin-top: 8px;
    }
  }
}
</style>
