export class TrackingProfile {
  [key: string]: any;

  userId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  birthDate: number;
  updatedTime: number;
  createdTime: number;
  fb?: string;
  twitter?: string;
  zalo?: string;
  phone?: string;
  gender?: string;
  avatarUrl?: string;
  properties?: any;

  constructor(
    userId: string,
    fullName: string,
    firstName: string,
    lastName: string,
    email: string,
    birthDate: number,
    updatedTime: number,
    createdTime: number,
    fb?: string,
    twitter?: string,
    zalo?: string,
    phone?: string,
    gender?: string,
    avatarUrl?: string,
    properties?: any
  ) {
    this.userId = userId || '';
    this.fullName = fullName || '';
    this.firstName = firstName || '';
    this.lastName = lastName || '';
    this.email = email || '';
    this.birthDate = birthDate || -1;
    this.updatedTime = updatedTime || -1;
    this.createdTime = createdTime || -1;
    this.fb = fb || void 0;
    this.twitter = twitter || void 0;
    this.zalo = zalo || void 0;
    this.phone = phone || void 0;
    this.gender = gender || void 0;
    this.avatarUrl = avatarUrl || void 0;
    this.properties = properties || void 0;
  }

  static fromObject(obj: any): TrackingProfile {
    return new TrackingProfile(
      obj.userId,
      obj.fullName,
      obj.firstName,
      obj.lastName,
      obj.email,
      obj.birthDate,
      obj.updatedTime,
      obj.createdTime,
      obj.fb,
      obj.twitter,
      obj.zalo,
      obj.phone,
      obj.gender,
      obj.avatarUrl,
      obj.properties
    );
  }
}
