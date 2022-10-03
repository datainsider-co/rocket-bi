import CryptoJS from 'crypto-js';

export class SecurityUtils {
  private static readonly key = '66C53869AEE51E9896D2C17D9E410A26EE5CC4EFA89E201A49C9ACAF45F214E1';
  private static readonly iv = 'IDEFA89E201A49C9ACAFDI';

  static encryptString(text: string) {
    const cipher = CryptoJS.AES.encrypt(text, CryptoJS.enc.Utf8.parse(this.key), {
      iv: CryptoJS.enc.Utf8.parse(this.iv),
      mode: CryptoJS.mode.CBC
    });

    return cipher.toString();
  }

  static decryptString(text: string) {
    const cipher = CryptoJS.AES.decrypt(text, CryptoJS.enc.Utf8.parse(this.key), {
      iv: CryptoJS.enc.Utf8.parse(this.iv),
      mode: CryptoJS.mode.CBC
    });

    return CryptoJS.enc.Utf8.stringify(cipher).toString();
  }
}
