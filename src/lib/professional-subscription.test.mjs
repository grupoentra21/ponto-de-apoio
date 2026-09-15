import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260915180000_professional_subscription_foundation.sql',
    import.meta.url,
  ),
  'utf8',
);
const adminPage = readFileSync(
  new URL('../app/admin/profissionais/[id]/page.tsx', import.meta.url),
  'utf8',
);
const professionalArea = readFileSync(
  new URL('../app/area-profissional/page.tsx', import.meta.url),
  'utf8',
);

test('subscription table is isolated from anonymous users and writable only through RPCs', () => {
  assert.match(migration, /alter table public\.professional_subscriptions enable row level security/i);
  assert.match(migration, /revoke all on table public\.professional_subscriptions from public, anon, authenticated/i);
  assert.match(migration, /grant select on table public\.professional_subscriptions to authenticated/i);
  assert.doesNotMatch(migration, /grant (insert|update|delete).*professional_subscriptions/i);
});

test('professionals can read only their own subscription while admins can read all', () => {
  assert.match(migration, /professional\.profile_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /or \(select public\.is_admin\(\)\)/i);
  assert.doesNotMatch(migration, /to anon[\s\S]*professional_subscriptions/i);
});

test('admin RPCs authenticate internally and are not executable by anon', () => {
  assert.equal((migration.match(/security definer/gi) ?? []).length, 2);
  assert.equal((migration.match(/set search_path = ''/gi) ?? []).length, 2);
  assert.equal((migration.match(/current_admin_id uuid := auth\.uid\(\)/g) ?? []).length, 2);
  assert.equal((migration.match(/profile\.role = 'admin'/g) ?? []).length, 2);
  assert.equal((migration.match(/grant execute on function[\s\S]*?to authenticated;/gi) ?? []).length, 2);
  assert.doesNotMatch(migration, /grant execute on function[\s\S]*?to anon;/i);
});

test('activation records its source, acting admin and audit event', () => {
  assert.match(migration, /'active',[\s\S]*?'admin',[\s\S]*?current_admin_id/i);
  assert.match(migration, /'subscription_activated'/);
  assert.match(migration, /'subscription_deactivated'/);
});

test('migration neither backfills subscriptions nor changes publication', () => {
  assert.doesNotMatch(
    migration,
    /insert into public\.professional_subscriptions\s*\([^;]+\)\s*select/i,
  );
  assert.doesNotMatch(migration, /update public\.professionals/i);
  assert.doesNotMatch(migration, /is_published\s*=/i);
});

test('admin and professional interfaces expose subscription status safely', () => {
  assert.match(adminPage, /Assinatura/);
  assert.match(adminPage, /SubscriptionActions/);
  assert.match(professionalArea, /Assinatura/);
  assert.match(professionalArea, /subscription\?\.status \?\? 'inactive'/);
  assert.doesNotMatch(professionalArea, /changeProfessionalSubscription/);
});
