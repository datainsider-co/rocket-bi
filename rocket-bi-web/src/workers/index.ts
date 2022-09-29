import * as Comlink from 'comlink';
import { DIWorker } from '@/workers/Worker';

const worker = Comlink.wrap<DIWorker>(new Worker('./Worker.ts', { type: 'module', name: 'data-insider' }));

export const DIWorkers: DIWorker = {
  calculateRowspan: worker.calculateRowspan,
  parsePureJson: worker.parsePureJson,
  parseObject: worker.parseObject,
  downloadCsvData: worker.downloadCsvData
};
