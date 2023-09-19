/*
 * @author: tvc12 - Thien Vi
 * @created: 6/3/21, 11:06 AM
 */

import { Component, Model, Prop, Ref, Vue } from 'vue-property-decorator';
import ClickOutside from 'vue-click-outside';
import { ListUtils, RandomUtils } from '@/utils';
import { DropdownData } from '@/shared/components/common/di-dropdown/DropdownData';
import { DropdownType } from '@/shared/components/common/di-dropdown/DropdownType';
import { StringUtils } from '@/utils/StringUtils';
import { BFormInput } from 'bootstrap-vue';
import { IdGenerator } from '@/utils/IdGenerator';
import { PopupUtils } from '@/utils/PopupUtils';
import { Log } from '@core/utils';

@Component({
  directives: {
    ClickOutside
  }
})
export default class DiDropdown extends Vue {
  private keyword = '';
  private static readonly SHOWN_KEY = 'dropdown:shown';
  @Model('change', { default: '' })
  private readonly value!: string | number;
  @Prop({ type: String, default: () => `'dropdown-${RandomUtils.nextString()}` })
  private readonly id!: string;
  @Prop({ type: String, default: '' })
  private readonly placeholder!: string;
  @Prop({ type: Boolean, default: false })
  private readonly disabled!: boolean;
  @Prop({ type: String, default: 'label' })
  private readonly valueProps!: string;
  @Prop({ type: String, default: 'label' })
  private readonly labelProps!: string;
  @Prop({ required: true, type: Array })
  private readonly data!: DropdownData[];
  @Prop({ default: false, type: Boolean })
  private appendAtRoot!: boolean;
  @Prop({ type: String, default: 'scrollParent' })
  private boundary!: 'scrollParent' | 'viewport' | 'window';

  @Prop({ required: false, default: true, type: Boolean })
  private readonly enableIconSelected!: boolean;

  @Prop({ type: Function, required: false })
  private onSearch?: (keyword: string, item: DropdownData) => boolean;

  @Prop({ required: false, default: false, type: Boolean })
  private readonly hidePlaceholderOnMenu!: boolean;

  @Prop({ required: false, default: false, type: Boolean })
  private readonly canHideOtherPopup!: boolean;

  @Prop({ required: false, type: String, default: 'No options available.' })
  private readonly emptyPlaceholder!: string;

  /**
   * target element show at element when appendAtRoot = false.
   * if targetId is null and appendAtRoot = false, target element is parent element.
   * @type {string} is id of element to show dropdown.
   */
  @Prop({ required: false, type: [String, Object] })
  private readonly containerId!: string;

  @Prop({ required: false, type: Boolean, default: false })
  private readonly border!: boolean;

  @Ref()
  private readonly scroller?: any;

  private selectedIndex = 1;

  @Ref()
  private readonly dropdown!: HTMLSpanElement;
  private currentWidth = 350;
  private isDropdownOpen = false;
  private readonly buttonId = `selected-id-${RandomUtils.nextInt()}`;
  @Ref()
  private readonly inputKeyword?: BFormInput;

  get finalOptions(): DropdownData[] {
    const results = this.filter(this.keyword, this._allOptions);
    return this.removeGroupEmpty(results);
  }

  private get _allOptions(): DropdownData[] {
    const options: DropdownData[] = [];
    if (!this.hidePlaceholderOnMenu) {
      this.addPlaceholder(options, this.placeholder, this.labelProps, this.valueProps);
    }
    this.addOptions(options, this.data);
    return options;
  }

  private get selectedItem() {
    return this._allOptions.find(item => this.getValue(item) === this.value);
  }

  private get label(): string {
    // const selectedItem = this._allOptions.find(item => this.getValue(item) === this.value);
    return this.selectedItem ? this.getLabel(this.selectedItem) : null;
  }

  protected get popoverStyle(): CSSStyleDeclaration {
    return {
      width: `${this.currentWidth}px`
    } as CSSStyleDeclaration;
  }

  protected get inputClass(): any {
    return {
      'cursor-pointer': !this.isDropdownOpen
    };
  }

  protected get computedContainerId(): string | undefined {
    if (this.appendAtRoot) {
      return void 0;
    }
    if (this.containerId) {
      return this.containerId;
    }
    return this.buttonId;
  }

  handleScroll(vertical: any, _: any, __: any) {
    this.$emit('scroll', process);
  }

  private removeGroupEmpty(options: DropdownData[]): DropdownData[] {
    const results = [];
    for (let index = 0; index < options.length; ++index) {
      const option = options[index];
      if (this.canSelect(option)) {
        results.push(option);
      } else {
        const nextOptions = options[index + 1];
        if (nextOptions && this.canSelect(nextOptions)) {
          results.push(option);
        }
      }
    }
    return results;
  }

  private handleKeywordChanged(event: KeyboardEvent): void {
    if (!this.isDropdownOpen) {
      this.showDropdown();
    }
  }

  // prevent unfocus input cause white space will trigger button click.
  private handleTypeWhitespace(event: KeyboardEvent): void {
    event.preventDefault();
    this.keyword = this.keyword + ' ';
  }

  private scrollToIndex(index: number, animation = true): void {
    // this.$nextTick(() => {
    if (this.scroller) {
      const id = IdGenerator.generateButtonId('dropdown', index);
      this.scroller.scrollIntoView(`#${id}`, animation ? 300 : 0);
    }
    // });
  }

  private onDefaultSearch(keyword: string, item: DropdownData): boolean {
    return StringUtils.isIncludes(keyword, this.getLabel(item));
  }

  private filter(keyword: string, allOptions: DropdownData[]): DropdownData[] {
    const canSearch = !!keyword;
    if (canSearch) {
      const onSearch = this.onSearch ?? this.onDefaultSearch;
      return allOptions.filter(option => {
        switch (option.type) {
          case DropdownType.Group:
            return true;
          default:
            return onSearch(keyword, option);
        }
      });
    } else {
      return allOptions;
    }
  }

  private addPlaceholder(options: any[], placeholder: string, labelProps: string, valueProps: string) {
    if (this.placeholder !== '') {
      const currentPlaceHolder: any = {};
      currentPlaceHolder[labelProps] = this.placeholder;
      currentPlaceHolder[valueProps] = '';
      options.push(currentPlaceHolder);
    }
  }

  private isSelected(item: DropdownData): boolean {
    const currentValue: any = this.getValue(item);
    return currentValue !== '' && this.value === currentValue;
  }

  private hideDropdown(): void {
    this.keyword = '';
    this.isDropdownOpen = false;
  }

  private showDropdown(): void {
    this.handleHideOtherPopup();
    this.isDropdownOpen = true;
    this.selectedIndex = this.getCurrentSelectedIndex();
    // this.scrollToIndex(this.selectedIndex);
    this.currentWidth = this.dropdown.clientWidth ?? 300;
    Log.debug('currentWidth', this.dropdown.clientWidth);
    this.$root.$emit(DiDropdown.SHOWN_KEY, this.id);
  }

  private handleHideOtherPopup() {
    if (this.canHideOtherPopup) {
      PopupUtils.hideAllPopup();
    }
  }

  private toggleDropdown(event: MouseEvent): void {
    if (this.isDropdownOpen) {
      this.hideDropdown();
    } else if (this.inputKeyword) {
      this.isDropdownOpen = true;
      this.inputKeyword.focus();
    }
  }

  private getValue(item: DropdownData): any {
    return item[this.valueProps];
  }

  private canSelect(item: DropdownData): boolean {
    const isNotGroup = item.type !== DropdownType.Group;
    const value = this.getValue(item);
    return isNotGroup && value !== '';
  }

  private select(item: DropdownData): void {
    if (this.canSelect(item)) {
      this.hideDropdown();
      const value = this.getValue(item);
      this.$emit('change', value);
      this.$emit('selected', item);
    }
  }

  private addOptions(options: any[], data: DropdownData[]) {
    if (Array.isArray(data)) {
      data.forEach(item => {
        switch (item.type) {
          case DropdownType.Group:
            options.push(item);
            this.addOptions(options, item.options ?? []);
            break;
          default:
            options.push(item);
        }
      });
    }
  }

  private getLabel(item: DropdownData) {
    return item[this.labelProps] || item[this.valueProps];
  }

  private cancelSearch(): void {
    if (this.inputKeyword) {
      const element = this.inputKeyword.$el as HTMLElement;
      element.blur();
    }
  }

  private getCurrentSelectedIndex() {
    const index = this._allOptions.findIndex(item => this.getValue(item) === this.value);
    return index ?? -1;
  }

  private getPreviousIndex() {
    let index = this.selectedIndex;
    if (index <= -1) {
      index = 0;
    }
    while (true) {
      if (index - 1 === -1) {
        // revert to old index
        index = this.selectedIndex;
        break;
      }
      index = index - 1;
      if (this.canSelect(this.finalOptions[index])) {
        break;
      }
    }
    return index;
  }

  private handleMoveUp(): void {
    this.selectedIndex = this.getPreviousIndex();
    this.scrollToIndex(this.selectedIndex);
  }

  private getNextIndex() {
    let index = this.selectedIndex;
    if (index >= this.finalOptions.length) {
      index = -1;
    }
    while (true) {
      if (index + 1 >= this.finalOptions.length) {
        // revert to old index
        index = this.selectedIndex;
        break;
      }
      index = index + 1;
      if (this.canSelect(this.finalOptions[index])) {
        break;
      }
    }
    return index;
  }

  private handleMoveDown(): void {
    this.selectedIndex = this.getNextIndex();
    this.scrollToIndex(this.selectedIndex);
  }

  private handleSelectItem(): void {
    const item = this.finalOptions[this.selectedIndex] ?? this.finalOptions.find(item => this.canSelect(item));
    if (item) {
      this.cancelSearch();
      this.select(item);
    }
  }

  mounted() {
    this.$root.$on(DiDropdown.SHOWN_KEY, this.handleDropdownShown);
  }

  beforeDestroy() {
    this.$root.$off(DiDropdown.SHOWN_KEY, this.handleDropdownShown);
  }

  private handleDropdownShown(id: string) {
    if (this.id !== id) {
      this.hideDropdown();
    }
  }

  private isEmpty(list: any[]): boolean {
    return ListUtils.isEmpty(list);
  }
}
