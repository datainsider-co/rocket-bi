import { HeaderData, IndexedHeaderData, CustomCell, CustomHeader, RowData } from '@/shared/models';
import { HtmlElementRenderUtils } from '@/utils/HtmlElementRenderUtils';
import { PopupUtils, RandomUtils } from '@/utils';
import { Log } from '@core/utils';
import { get } from 'lodash';
import { JobId } from '@core/common/domain';

export class CheckBoxHeaderController {
  private unselectAllLister?: () => void;

  addUnselectAllListener(listener: () => void) {
    this.unselectAllLister = listener;
  }

  reset() {
    this.unselectAllLister?.call(this);
  }
}

export class CheckBoxHeaderData implements HeaderData {
  key: string;
  label: string;
  customRenderBodyCell?: CustomCell;
  customRenderHeader?: CustomHeader;
  items: any[] = [];
  private prefixId = `checkbox-${RandomUtils.nextInt(1000, 9999)}`;
  private selectedIndexAsSet = new Set<any>();
  private keyPath = '';
  private callback: () => void;

  private getSelectAllId(): string {
    return `${this.prefixId}-all`;
  }

  private getSelectId(rowIndex: number): string {
    return `${this.prefixId}-${rowIndex}`;
  }

  constructor(
    selectedIndexAsSet: Set<any>,
    keyPath: string,
    controller: CheckBoxHeaderController,
    items: any[],
    headerData: {
      key?: string;
      label?: string;
      width: number;
    },
    onSelect: () => void
  ) {
    this.selectedIndexAsSet = selectedIndexAsSet;
    Object.assign(this, headerData);
    this.key = headerData.key || 'checked';
    this.label = headerData.label || '';
    this.callback = onSelect;
    this.keyPath = keyPath;
    this.items = items;
    this.customRenderHeader = new CustomHeader(_ => {
      return HtmlElementRenderUtils.renderCheckBox(
        this.isSelectedAll(),
        event => {
          event.stopPropagation();
          this.toggleCheckAll();
          this.callback();
        },
        () => this.getSelectAllId()
      );
    });
    this.customRenderBodyCell = new CustomCell((rowData: RowData, rowIndex: number) => {
      const key = get(rowData, keyPath, '');
      return HtmlElementRenderUtils.renderCheckBox(
        this.isSelected(key),
        event => {
          event.stopPropagation();
          PopupUtils.hideAllPopup();
          this.toggle(key);
          this.callback();
        },
        () => this.getSelectId(rowIndex)
      );
    });
    this.setupController(controller);
  }

  private setupController(controller: CheckBoxHeaderController) {
    controller.addUnselectAllListener(() => {
      this.unselectAll();
    });
  }

  private isSelectedAll(): boolean {
    Log.debug('isSelectedAll::', this.selectedIndexAsSet, this.items);
    return this.selectedIndexAsSet.size === this.items.length;
  }

  private toggleCheckAll(): void {
    if (this.isSelectedAll()) {
      Log.debug('unselectAll');
      this.unselectAll();
    } else {
      Log.debug('selectALl');
      this.selectAll();
    }
  }

  private toggle(key: any): void {
    if (this.isSelected(key)) {
      this.unselect(key);
    } else {
      this.select(key);
    }
  }

  private isSelected(key: any): boolean {
    return this.selectedIndexAsSet.has(key);
  }

  private unselect(key: any) {
    this.selectedIndexAsSet.delete(key);
    this.setCheckedValue(this.getSelectAllId(), false);
  }

  private select(key: any) {
    this.selectedIndexAsSet.add(key);
    if (this.isSelectedAll()) {
      this.setCheckedValue(this.getSelectAllId(), true);
    }
  }

  private unselectAll() {
    this.selectedIndexAsSet.clear();
    this.setCheckedValue(this.getSelectAllId(), false);
    for (let index = 0; index < this.items.length; index++) {
      const id = this.getSelectId(index);
      this.setCheckedValue(id, false);
    }
  }

  private setCheckedValue(id: string, value: boolean) {
    const checkbox = document.getElementById(id) as HTMLInputElement;
    if (checkbox) {
      checkbox.checked = value;
    }
  }

  private selectAll() {
    this.setCheckedValue(this.getSelectAllId(), true);
    for (let index = 0; index < this.items.length; index++) {
      const key = get(this.items[index], this.keyPath, '');
      this.selectedIndexAsSet.add(key);
      const id = this.getSelectId(index);
      this.setCheckedValue(id, true);
    }
  }
}
