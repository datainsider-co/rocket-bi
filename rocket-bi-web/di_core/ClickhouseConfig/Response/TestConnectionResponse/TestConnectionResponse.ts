export class TestConnectionResponse {
  constructor(public isSuccess: boolean, public errorMsg?: string) {}

  static fromObject(obj: TestConnectionResponse) {
    return new TestConnectionResponse(obj.isSuccess, obj.errorMsg);
  }
}
