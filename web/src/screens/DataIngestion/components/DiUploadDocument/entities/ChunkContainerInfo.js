class ChunkItem {
  constructor(index) {
    this.index = index;
    this.reset();
  }

  reset() {
    this.loading = false;
    this.success = false;
    this.error = '';
    this.done = false;
    this.startLineNumber = 0;
    this.loadingPercent = 0;
    this.totalLines = 0;
    this.totalCharacter = 0;
    this.firstLine = '';
    this.lastLine = '';
    this.fixedFirstLine = '';
    this.lines = [];
  }

  get index() {
    return this._index;
  }

  set index(value) {
    this._index = value;
  }

  get name() {
    return `Chunk ${this.index + 1}`;
  }

  get loadingPercentStr() {
    return `${this.loadingPercent}%`;
  }
}

export class ChunkContainerInfo {
  constructor(total) {
    this._total = total;
    this._processIndex = 0;
    this._items = [];
    for (let i = 0; i < this._total; i++) {
      this._items.push(new ChunkItem(i));
    }
  }

  reset() {
    this._processIndex = 0;
    this.items.forEach(item => item.reset());
  }

  get total() {
    return this._total;
  }
  //
  // set total(value) {
  //   this._total = value
  //   this._processIndex = 0
  //   this._items = []
  //   for (let i = 0; i < this._total; i++) {
  //     this._items.push(new ChunkItem(i))
  //   }
  // }

  next() {
    this._processIndex += 1;
  }

  get items() {
    return this._items;
  }

  get uploadingItems() {
    return this._items.filter(i => i.loading);
  }

  get successItems() {
    return this._items.filter(i => i.success);
  }

  get failItems() {
    return this._items.filter(i => i.error);
  }

  get doneItems() {
    return this._items.filter(i => i.done);
  }

  get loadingPercent() {
    if (this.total <= 0) return 0;
    return ((this.doneItems.length / this.total) * 100).toFixed(2);
  }

  get loadingPercentStr() {
    return `${this.loadingPercent}%`;
  }

  get processItem() {
    return this._items[this._processIndex];
  }

  get prevProcessItem() {
    return this._items[this._processIndex - 1];
  }

  get done() {
    return this.doneItems.length === this.total;
  }

  get success() {
    return this.done && this.failItems.length === 0;
  }

  get fail() {
    return this.done && this.failItems.length > 0;
  }
}
