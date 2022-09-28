export class FilePart {
  readonly lines: string[][] = [];
  approximatedSizeInBytes = 0;

  constructor(public readonly name: string) {}

  addLines(lines: string[][]) {
    if (lines && lines.length > 0) {
      lines.forEach(line => {
        this.lines.push(line);
      });
      this.updateFileSize(lines);
    }
  }

  updateFileSize(lines: string[][]) {
    this.approximatedSizeInBytes += lines
      .map(fields => {
        return new Blob(fields).size;
      })
      .reduce((accumulatedValue: number, currentValue: number) => accumulatedValue + currentValue);
  }

  getLineCount(): number {
    return this?.lines?.length ?? 0;
  }

  hasData(): boolean {
    return this.getLineCount() > 0;
  }

  isCompleted(maxSizeInBytes: number): boolean {
    return this.approximatedSizeInBytes >= maxSizeInBytes;
  }
}
