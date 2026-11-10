import { describe, expect, it } from 'vitest';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  it('keeps property keys as the server sent them', () => {
    const profile = new UserProfile({ username: 'u', properties: { 'My Field': 'a', 'ssl.mode': 'b', region_code: 'VN' } });

    expect(profile.properties).toEqual({ 'My Field': 'a', 'ssl.mode': 'b', region_code: 'VN' });
    expect(profile.toJson()['properties']).toEqual({ 'My Field': 'a', 'ssl.mode': 'b', region_code: 'VN' });
  });

  it('drops property values that are not strings and reads a missing map as empty', () => {
    expect(new UserProfile({ properties: { a: 1, b: 'x' } }).properties).toEqual({ b: 'x' });
    expect(new UserProfile({}).properties).toEqual({});
  });
});
