export class EditUserProfileRequest {
  username!: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  //@see UserGenders
  gender?: number;
  dob?: number;
  avatar?: string;
  properties?: { [key: string]: string };

  constructor(
    username: string,
    fullName?: string,
    firstName?: string,
    lastName?: string,
    mobilePhone?: string,
    gender?: number,
    dob?: number,
    avatar?: string,
    properties?: { [p: string]: string }
  ) {
    this.username = username;
    this.fullName = fullName;
    this.firstName = firstName;
    this.lastName = lastName;
    this.mobilePhone = mobilePhone;
    this.gender = gender;
    this.dob = dob;
    this.avatar = avatar;
    this.properties = properties;
  }

  static create(
    username: string,
    data: {
      fullName?: string;
      firstName?: string;
      lastName?: string;
      mobilePhone?: string;
      gender?: number;
      dob?: number;
      avatar?: string;
      properties?: { [p: string]: string };
    }
  ) {
    return new EditUserProfileRequest(
      username,
      data.fullName ?? void 0,
      data.firstName ?? void 0,
      data.lastName ?? void 0,
      data.mobilePhone ?? void 0,
      data.gender ?? void 0,
      data.dob ?? void 0,
      data.avatar ?? void 0,
      data.properties ?? void 0
    );
  }
}
