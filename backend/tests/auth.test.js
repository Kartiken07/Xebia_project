import { validatePassword } from '../routes/auth.js';

describe('Auth validation tests', () => {
  test('validatePassword requires at least 8 characters', () => {
    expect(validatePassword('Short1!')).toBe(false);
  });

  test('validatePassword requires uppercase letter', () => {
    expect(validatePassword('nouppercase1!')).toBe(false);
  });

  test('validatePassword requires lowercase letter', () => {
    expect(validatePassword('NOLOWERCASE1!')).toBe(false);
  });

  test('validatePassword requires number', () => {
    expect(validatePassword('NoNumberHere!')).toBe(false);
  });

  test('validatePassword requires special character', () => {
    expect(validatePassword('NoSpecialChar123')).toBe(false);
  });

  test('validatePassword accepts valid password', () => {
    expect(validatePassword('Valid@Password123')).toBe(true);
  });
});
