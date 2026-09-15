import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260915143000_save_professional_profile_rpc.sql',
    import.meta.url,
  ),
  'utf8',
);

test('RPC identifies the caller with auth.uid and exposes no identifier parameters', () => {
  assert.match(migration, /current_user_id uuid := auth\.uid\(\)/);
  assert.doesNotMatch(
    migration.slice(0, migration.indexOf('returns void')),
    /p_(?:user|profile|professional)_id|p_role|p_status|p_is_published|p_reviewed_/,
  );
  assert.match(migration, /if current_user_id is null then/);
});

test('RPC validates the full name and updates only the caller profile', () => {
  assert.match(
    migration,
    /normalized_full_name text := trim\(coalesce\(p_full_name, ''\)\)/,
  );
  assert.match(
    migration,
    /char_length\(normalized_full_name\) not between 2 and 120/,
  );
  assert.match(
    migration,
    /update public\.profiles[\s\S]*where id = current_user_id/,
  );
});

test('RPC rejects suspended records and applies the existing review transition', () => {
  assert.match(migration, /current_professional\.status = 'suspended'/);
  assert.match(
    migration,
    /current_professional\.status in \('approved', 'pending_review'\)[\s\S]*then 'pending_review'/,
  );
  assert.match(migration, /is_published = false/);
  assert.match(migration, /reviewed_by = null/);
  assert.match(migration, /reviewed_at = null/);
});

test('RPC supports both insert and update in one database function', () => {
  assert.match(migration, /insert into public\.professionals/);
  assert.match(migration, /update public\.professionals/);
  assert.match(migration, /where profile_id = current_user_id/);
});

test('RPC uses invoker rights and is executable only by authenticated', () => {
  assert.match(migration, /security invoker/);
  assert.match(migration, /set search_path = ''/);
  assert.match(
    migration,
    /revoke all on function public\.save_own_professional_profile\([\s\S]*\) from public/,
  );
  assert.match(
    migration,
    /grant execute on function public\.save_own_professional_profile\([\s\S]*\) to authenticated/,
  );
  assert.doesNotMatch(migration, /grant execute[\s\S]*to anon/);
});
