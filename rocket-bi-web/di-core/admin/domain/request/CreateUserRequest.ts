export class CreateUserRequest {
  email!: string;
  password!: string;
  fullName?: string;
  firstName!: string;
  lastName!: string;

  constructor(email: string, password: string, fullName: string, firstName: string, lastName: string) {
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
