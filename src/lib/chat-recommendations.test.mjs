import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isChatRecommendations,
  serviceModeLabel,
} from './chat-recommendations.ts';

const recommendation = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Profissional de teste',
  reason: 'Atende aos critérios informados.',
};

test('aceita recomendações estruturadas e preserva a ausência de resultados', () => {
  assert.equal(isChatRecommendations([recommendation]), true);
  assert.equal(isChatRecommendations([]), true);
});

test('rejeita metadados corrompidos ou excessivos restaurados da sessão', () => {
  for (const value of [
    null,
    {},
    [null],
    [{ ...recommendation, id: '../../privado' }],
    [{ ...recommendation, name: 5 }],
    [{ ...recommendation, reason: 'a'.repeat(1501) }],
    Array(9).fill(recommendation),
  ]) {
    assert.equal(isChatRecommendations(value), false);
  }
});

test('mantém a distinção entre atendimento presencial, online e híbrido', () => {
  assert.equal(serviceModeLabel('online'), 'Online');
  assert.equal(serviceModeLabel('in_person'), 'Presencial');
  assert.equal(serviceModeLabel('hybrid'), 'Online e presencial');
});
