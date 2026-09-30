import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260928110000_add_professional_specialty.sql',
    import.meta.url,
  ),
  'utf8',
);

test('professional specialty is stored and validated by the profile RPC', () => {
  assert.match(migration, /add column specialty text/);
  assert.match(migration, /professionals_specialty_length_check/);
  assert.match(migration, /p_specialty text/);
  assert.match(
    migration,
    /normalized_specialty text := nullif\(trim\(p_specialty\), ''\)/,
  );
  assert.match(migration, /specialty = normalized_specialty/);
});
