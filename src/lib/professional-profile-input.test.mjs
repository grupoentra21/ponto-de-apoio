import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isValidProfessionalFullName,
  normalizeProfessionalFullName,
} from './professional-profile-input.ts';

test('accepts a valid professional full name', () => {
  assert.equal(isValidProfessionalFullName('Camila Ribeiro'), true);
});

test('trims whitespace at the edges of a professional full name', () => {
  assert.equal(
    normalizeProfessionalFullName('  Camila Ribeiro  '),
    'Camila Ribeiro',
  );
  assert.equal(isValidProfessionalFullName('  Camila Ribeiro  '), true);
});

test('rejects professional full names shorter than two characters', () => {
  assert.equal(isValidProfessionalFullName(' A '), false);
  assert.equal(isValidProfessionalFullName('   '), false);
});

test('rejects professional full names longer than 120 characters', () => {
  assert.equal(isValidProfessionalFullName('A'.repeat(121)), false);
});
