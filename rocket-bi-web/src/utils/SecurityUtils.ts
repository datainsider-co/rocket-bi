import { sha256 } from 'js-sha256';

export abstract class SecurityUtils {
  static hash(text: string): string {
    return sha256(text);
  }
}
