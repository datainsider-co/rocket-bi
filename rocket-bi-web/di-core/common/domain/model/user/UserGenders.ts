/*
 * @author: tvc12 - Thien Vi
 * @created: 5/30/21, 10:23 PM
 */

export class UserGenders {
  static readonly Other = -1;
  static readonly Female = 0;
  static readonly Male = 1;

  /**
   * Get all gender detail
   * @return a list of tuple [string,number]. Where the key is gender's display name & the value is its id
   */
  static allGenders(): [string, number][] {
    return [
      ['Female', UserGenders.Female],
      ['Male', UserGenders.Male],
      ['Other', UserGenders.Other]
    ];
  }

  static toDisplayName(gender: number): string {
    switch (gender) {
      case UserGenders.Other:
        return 'Other';
      case UserGenders.Female:
        return 'Female';
      case UserGenders.Male:
        return 'Male';
      default:
        return 'Unknown';
    }
  }

  static toGenderId(gender: number): number {
    switch (gender) {
      case UserGenders.Other:
        return UserGenders.Other;
      case UserGenders.Female:
        return UserGenders.Female;
      case UserGenders.Male:
        return UserGenders.Male;
      default:
        return UserGenders.Other;
    }
  }
}
