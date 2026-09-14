import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isPublicProfessional,
  professionalIdFromSlug,
  professionalProfilePath,
  safeProfessionalCatalogReturnPath,
  slugifyProfessionalName,
} from './professional-public-profile.ts';

const id = '9d91a9ba-a362-4b6b-a848-dbc8841864f0';

test('gera URL legível usando um identificador profissional estável', () => {
  assert.equal(slugifyProfessionalName('Camila Ribeiro'), 'camila-ribeiro');
  assert.equal(
    professionalProfilePath('Camila Ribeiro', id),
    `/profissionais/camila-ribeiro--${id}`,
  );
});

test('preserva filtros no retorno sem permitir URL externa', () => {
  const filteredCatalog = '/profissionais?q=luto&modalidade=online';
  assert.equal(
    safeProfessionalCatalogReturnPath(filteredCatalog),
    filteredCatalog,
  );
  assert.equal(
    safeProfessionalCatalogReturnPath('https://site-malicioso.com'),
    '/profissionais',
  );
  assert.equal(
    safeProfessionalCatalogReturnPath('//site-malicioso.com'),
    '/profissionais',
  );
  assert.equal(
    safeProfessionalCatalogReturnPath('javascript:alert(1)'),
    '/profissionais',
  );
  assert.equal(
    safeProfessionalCatalogReturnPath(
      'data:text/html,<script>alert(1)</script>',
    ),
    '/profissionais',
  );
  assert.equal(
    safeProfessionalCatalogReturnPath('http://site-malicioso.com'),
    '/profissionais',
  );
});

test('disponibiliza somente profissionais aprovados e publicados', () => {
  assert.equal(
    isPublicProfessional({ status: 'approved', is_published: true }),
    true,
  );
  assert.equal(
    isPublicProfessional({ status: 'approved', is_published: false }),
    false,
  );
  assert.equal(
    isPublicProfessional({ status: 'pending_review', is_published: true }),
    false,
  );
  assert.equal(isPublicProfessional(null), false);
});

test('resolve o identificador sem depender do nome ou de sua unicidade', () => {
  assert.equal(professionalIdFromSlug(`nome-atualizado--${id}`), id);
  assert.equal(professionalIdFromSlug('camila-ribeiro'), null);
  assert.equal(
    professionalIdFromSlug('camila-ribeiro--identificador-invalido'),
    null,
  );
});
