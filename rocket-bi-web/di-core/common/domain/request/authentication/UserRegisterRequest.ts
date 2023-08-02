export class UserRegisterRequest {
  email!: string;
  password!: string;
  gender?: number;
  dod?: number;
  nationality?: string;
  nativeLanguages?: string[];
}
