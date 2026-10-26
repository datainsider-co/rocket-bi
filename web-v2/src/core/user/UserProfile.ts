import Deneric from 'deneric2';

/** Personal data. Field names follow the backend `UserProfile` case class. */
export class UserProfile extends Deneric {
  username = '';
  fullName = '';
  firstName = '';
  lastName = '';
  email = '';
  mobilePhone = '';
  gender = 0;
  /** Epoch millis; 0 when unknown. */
  dob = 0;
  avatar = '';
  alreadyConfirmed = false;
  /** User-defined fields. Keys are data, kept exactly as the server sent them. */
  properties: Record<string, string> = {};
  updatedTime = 0;
  createdTime = 0;

  constructor(json?: unknown) {
    super({
      username: ['username', String],
      fullName: ['full_name', String],
      firstName: ['first_name', String],
      lastName: ['last_name', String],
      email: ['email', String],
      mobilePhone: ['mobile_phone', String],
      gender: ['gender', Number],
      dob: ['dob', Number],
      avatar: ['avatar', String],
      alreadyConfirmed: ['already_confirmed', Boolean],
      properties: ['properties', Deneric.Map(String)],
      updatedTime: ['updated_time', Number],
      createdTime: ['created_time', Number]
    });
    this.fromJson(json);
  }

  /** Same fallback order as v1's `getName`. */
  get displayName(): string {
    return (
      this.fullName || `${this.firstName} ${this.lastName}`.trim() || this.email || this.username
    );
  }
}
