import * as Comlink from 'comlink';
import { DIWorker } from '@/workers/worker';

const worker = Comlink.wrap<DIWorker>(new Worker('./worker.ts', { type: 'module', name: 'data-insider' }));

export const DIWorkers: DIWorker = {
  calculateRowspan: worker.calculateRowspan,
  parsePureJson: worker.parsePureJson,
  parseObject: worker.parseObject,
  downloadCsvData: worker.downloadCsvData
};
