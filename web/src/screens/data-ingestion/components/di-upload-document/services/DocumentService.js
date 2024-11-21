import { ChunkContainerInfo } from '../entities/ChunkContainerInfo';
import { Log } from '@core/utils';
import { PopupUtils } from '@/utils/PopupUtils';

const DocumentService = Object.freeze({
  initChunkContainer(file, chunkSize) {
    if (!file) {
      PopupUtils.showError('Please choose file to upload');
      return;
    }
    if (file <= 0) {
      PopupUtils.showError('Please choose other file. The size of this file is zero!');
      return;
    }
    return new ChunkContainerInfo(Math.ceil(file.size / chunkSize));
  },
  async readChunk(file, chunkContainer, chunkSize, encoding) {
    if (chunkContainer.total <= 0) {
      Log.debug('Empty chunks');
      // alert('Please choose file to upload')
      return Promise.resolve(false);
    }
    if (!chunkContainer.processItem) {
      Log.debug('All done');
      return Promise.resolve(false);
    }
    return new Promise(resolve => {
      const chunkIndex = chunkContainer.processItem.index;
      Log.debug('Chunk Index = ', chunkContainer.processItem.index);

      var reader = new FileReader();
      reader.onload = e => {
        Log.debug('end read file');
        const content = e.target.result;
        const lines = content.split(/\r?\n|\r/);
        const totalLines = lines.length;
        const totalCharacter = content.length;
        chunkContainer.processItem.startLineNumber = 0;
        chunkContainer.processItem.totalCharacter = totalCharacter;
        chunkContainer.processItem.firstLine = lines[0];
        chunkContainer.processItem.lastLine = lines[totalLines - 1];

        if (chunkContainer.prevProcessItem) {
          chunkContainer.processItem.startLineNumber = chunkContainer.prevProcessItem.startLineNumber + chunkContainer.prevProcessItem.totalLines;
          chunkContainer.processItem.fixedFirstLine = [chunkContainer.prevProcessItem.lastLine || '', chunkContainer.processItem.firstLine].join('');
        } else {
          chunkContainer.processItem.fixedFirstLine = chunkContainer.processItem.firstLine;
        }
        let processLines = [];
        if (chunkContainer.processItem.index === chunkContainer.total - 1) {
          processLines = [chunkContainer.processItem.fixedFirstLine].concat(lines.slice(1));
        } else {
          processLines = [chunkContainer.processItem.fixedFirstLine].concat(lines.slice(1, chunkContainer.processItem.lines.length - 1));
        }
        chunkContainer.processItem.lines = processLines.filter(line => !!line);
        chunkContainer.processItem.totalLines = chunkContainer.processItem.lines.length;
        chunkContainer.next();
        resolve(true);
      };
      reader.onerror = e => {
        Log.error(e);
        resolve(false);
      };
      // .slice(0, 10 * 1024 * 1024)
      const startFrom = chunkIndex * chunkSize;
      Log.debug(`Read From = ${startFrom} -> ${startFrom + chunkSize}`);
      reader.readAsText(file.slice(startFrom, startFrom + chunkSize), encoding);
      Log.debug('start read file');
    });
  }
});

export default DocumentService;
