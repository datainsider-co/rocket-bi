import { UploadService, UploadServiceImpl } from '@core/services/upload.service';
import { DevModule, DI, TestHttpModule, testModule } from '@core/modules';
import { Log } from '@core/utils';

describe('upload file to server', () => {
  let uploadService: UploadService;

  before(() => {
    DI.init([new TestHttpModule(), new DevModule(), testModule]);
    uploadService = DI.get<UploadService>(UploadService);
    Log.debug('uploadService is UploadServiceImpl::', uploadService instanceof UploadServiceImpl);
  });

  it('should upload image successfuly', async () => {
    // do thingss
  });
});
