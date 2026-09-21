import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizeHashtag,
  professionalHashtags,
} from './professional-hashtags.ts';

test('extrai somente hashtags declaradas, sem inferir especialidades', () => {
  assert.deepEqual(professionalHashtags('Atuação com ansiedade e luto.'), []);
  assert.deepEqual(professionalHashtags(null), []);
  assert.deepEqual(
    professionalHashtags(
      'Atendimento. #Luto #SaúdeMental (#Terapia_de_casal) #Online',
    ),
    ['Luto', 'SaúdeMental', 'Terapia_de_casal', 'Online'],
  );
});
test('deduplica maiúsculas e acentos e normaliza filtro compartilhável', () => {
  assert.deepEqual(
    professionalHashtags('#Ansiedade #ansiedade #Saúde #saude'),
    ['Ansiedade', 'Saúde'],
  );
  assert.equal(normalizeHashtag(' #SAÚDE '), 'saude');
});
test('ignora fragmentos de URL, tags vazias e palavras maiores que o limite', () => {
  assert.deepEqual(
    professionalHashtags(
      `https://example.com/#perfil email#teste # #${'a'.repeat(41)} #Luto!`,
    ),
    ['Luto'],
  );
});
test('limita a doze hashtags por profissional', () => {
  assert.equal(
    professionalHashtags(
      Array.from({ length: 20 }, (_, i) => `#Tema${i}`).join(' '),
    ).length,
    12,
  );
});
