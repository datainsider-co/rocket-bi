export class TransferUserDataConfig {
  targetUserEmail!: string;
  isTransferDirectoryAndDashboardEnabled?: boolean;

  constructor(email: string, isTransferDirectoryAndDashboardEnabled?: boolean) {
    this.targetUserEmail = email;
    this.isTransferDirectoryAndDashboardEnabled = isTransferDirectoryAndDashboardEnabled;
  }
}

export class DeleteUserRequest {
  username!: string;
  transferDataConfig?: TransferUserDataConfig;

  constructor(username: string, transferDataConfig?: TransferUserDataConfig) {
    this.username = username;
    this.transferDataConfig = transferDataConfig;
  }
}
