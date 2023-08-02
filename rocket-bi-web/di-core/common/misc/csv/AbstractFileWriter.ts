import FileSaver from 'file-saver';

export abstract class AbstractFileWriter {
  abstract write(string: string): Promise<void>;

  abstract close(): void;
}

export class DownloadableFileWriter extends AbstractFileWriter {
  private buffer: string[] = [];

  constructor(private readonly path: string, private append: boolean, private readonly encoding = 'utf8') {
    super();
  }

  async write(string: string): Promise<void> {
    this.buffer.push(string);
  }

  close(): void {
    const blob = new Blob([this.buffer.join()], {
      type: 'text/plain;charset=utf-8'
    });
    FileSaver.saveAs(blob, this.path);
  }
}
