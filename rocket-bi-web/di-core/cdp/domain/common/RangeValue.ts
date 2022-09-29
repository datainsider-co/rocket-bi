export class RangeValue<T> {
  from: T;
  to: T;

  constructor(from: T, to: T) {
    this.from = from;
    this.to = to;
  }
}
