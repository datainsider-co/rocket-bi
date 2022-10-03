import { UploadService, UploadServiceImpl } from '@core/common/services/UploadService';
import { DevModule, Di, TestModule } from '@core/common/modules';
import { Log } from '@core/utils';
import { HttpTestModule } from '@core/common/modules/TestHttpModule';

describe('upload file to server', () => {
  let uploadService: UploadService;

  before(() => {
    Di.init([new HttpTestModule(), new DevModule(), new TestModule()]);
    uploadService = Di.get<UploadService>(UploadService);
    Log.debug('uploadService is UploadServiceImpl::', uploadService instanceof UploadServiceImpl);
  });

  it('should upload image successfuly', async () => {
    // do thingss
  });
});
