import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  isSafeProfessionalProfilePath,
  splitProfessionalProfileLinks,
} from './chat-professional-links.ts';

test('aceita somente uma rota interna de perfil profissional', () => {
  assert.equal(
    isSafeProfessionalProfilePath('/profissionais/camila-ribeiro--UUID'),
    true,
  );

  for (const unsafeValue of [
    'https://site-malicioso.com',
    'http://site-malicioso.com',
    '//site-malicioso.com',
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
  ]) {
    assert.equal(isSafeProfessionalProfilePath(unsafeValue), false, unsafeValue);
  }
});

test('converte somente URLs de perfis e não exibe a URL como texto', () => {
  const href = '/profissionais/camila-ribeiro--UUID';
  const segments = splitProfessionalProfileLinks(`Camila\nPerfil: ${href}`);

  assert.deepEqual(segments, [
    { type: 'text', content: 'Camila' },
    { type: 'text', content: '\n' },
    { type: 'professional-profile', href },
  ]);
  assert.equal(
    segments.some(
      (segment) => segment.type === 'text' && segment.content.includes(href),
    ),
    false,
  );
  assert.deepEqual(splitProfessionalProfileLinks('/acolhimento'), [
    { type: 'text', content: '/acolhimento' },
  ]);
  assert.deepEqual(splitProfessionalProfileLinks('https://site-malicioso.com'), [
    { type: 'text', content: 'https://site-malicioso.com' },
  ]);
  assert.deepEqual(
    splitProfessionalProfileLinks(
      'https://site-malicioso.com/profissionais/perfil-falso',
    ),
    [
      {
        type: 'text',
        content: 'https://site-malicioso.com/profissionais/perfil-falso',
      },
    ],
  );
});

test('converte dois perfis preservando todo o texto ao redor', () => {
  const firstHref = '/profissionais/camila-ribeiro--UUID1';
  const secondHref = '/profissionais/helena-vance--UUID2';
  const segments = splitProfessionalProfileLinks(
    `Antes ${firstHref} entre os perfis ${secondHref} depois`,
  );
  const links = segments.filter(
    (segment) => segment.type === 'professional-profile',
  );
  const text = segments
    .filter((segment) => segment.type === 'text')
    .map((segment) => segment.content)
    .join('');

  assert.deepEqual(links, [
    { type: 'professional-profile', href: firstHref },
    { type: 'professional-profile', href: secondHref },
  ]);
  assert.equal(links.length, 2);
  assert.equal(text, 'Antes  entre os perfis  depois');
  assert.equal(text.includes(firstHref), false);
  assert.equal(text.includes(secondHref), false);
});

test('CTA possui abertura segura em nova aba', async () => {
  const component = await readFile(
    new URL('../components/chat/chat-demo.tsx', import.meta.url),
    'utf8',
  );

  assert.match(component, /target="_blank"/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, />\s*Ver perfil profissional\s*</);
});
