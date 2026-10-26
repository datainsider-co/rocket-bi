import { describe, expect, it } from 'vitest';
import { Directory } from './Directory';

describe('Directory', () => {
  it("reads a dashboard's password config", () => {
    // `GET directories/{id}` from the local backend once v1's share dialog set a password.
    const directory = new Directory({ id: 9, directory_type: 'dashboard', data: { config: { enabled: true, hashed_password: 'ba78' } } });
    expect(directory).toMatchObject({ passwordEnabled: true, hashedPassword: 'ba78' });
  });

  it('has no password without data, or with an empty one', () => {
    expect(new Directory({ id: 9 })).toMatchObject({ passwordEnabled: false, hashedPassword: '' });
    expect(new Directory({ id: 9, data: {} })).toMatchObject({ passwordEnabled: false, hashedPassword: '' });
  });
});
