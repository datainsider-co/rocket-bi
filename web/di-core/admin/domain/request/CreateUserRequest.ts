import { UserGroup } from '@core/common/domain/model/user/UserGroup';

export class CreateUserRequest {
  email!: string;
  password!: string;
  fullName?: string;
  firstName!: string;
  lastName!: string;
  userGroup!: UserGroup;

  constructor(email: string, password: string, fullName: string, firstName: string, lastName: string, userGroup: UserGroup) {
    this.email = email;
    this.password = password;
    this.fullName = fullName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userGroup = userGroup;
  }
}
