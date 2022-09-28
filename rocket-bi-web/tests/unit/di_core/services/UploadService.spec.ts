import { UploadService, UploadServiceImpl } from '@core/services/upload.service';
import { DevModule, DI, TestModule } from '@core/modules';
import { Log } from '@core/utils';
import { HttpTestModule } from '@core/modules/http.test.modules';

describe('upload file to server', () => {
  let uploadService: UploadService;

  before(() => {
    DI.init([new HttpTestModule(), new DevModule(), new TestModule()]);
    uploadService = DI.get<UploadService>(UploadService);
    Log.debug('uploadService is UploadServiceImpl::', uploadService instanceof UploadServiceImpl);
  });

  it('should upload image successfuly', async () => {
    // do thingss
  });
});
