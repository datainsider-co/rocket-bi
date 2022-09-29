export class EventHeightCalculator {
  private readonly fromOffsetYAsMap = new Map<string, number>();
  private readonly toOffsetYAsMap = new Map<string, number>();

  getToHeight(to: string): number {
    return this.toOffsetYAsMap.get(to) ?? 0;
  }

  getFromHeight(from: string): number {
    return this.fromOffsetYAsMap.get(from) ?? 0;
  }

  addFromHeight(from: string, height: number) {
    const currentSize = this.getFromHeight(from);
    this.fromOffsetYAsMap.set(from, currentSize + height);
  }

  addToHeight(to: string, height: number) {
    const currentSize = this.getToHeight(to);
    this.toOffsetYAsMap.set(to, currentSize + height);
  }
}
