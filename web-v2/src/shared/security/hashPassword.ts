import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

/**
 * v1 `SecurityUtils.hash`: sha256 as lowercase hex, what a dashboard's `hashed_password` holds. `@noble/hashes`, as
 * `crypto.subtle` needs a secure context.
 */
export function hashPassword(password: string): string {
  return bytesToHex(sha256(utf8ToBytes(password)));
}
