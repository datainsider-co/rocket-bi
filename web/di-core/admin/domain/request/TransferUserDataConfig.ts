export class DeleteUserRequest {
  username!: string;
  transferToEmail?: string;

  constructor(username: string, transferToEmail?: string) {
    this.username = username;
    this.transferToEmail = transferToEmail;
  }
}
