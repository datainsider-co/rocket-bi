export class PartitionAndOffset {
  constructor(public partition: number, public offset: number) {}

  static fromObject(obj: PartitionAndOffset) {
    return new PartitionAndOffset(obj.partition, obj.offset);
  }
}
