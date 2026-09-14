import assert from 'node:assert/strict';
import test from 'node:test';
import {
  IMMEDIATE_RISK_RESPONSE,
  hasClearImmediateRisk,
} from './alice-safety.ts';
import { ALICE_INSTRUCTIONS } from './alice-prompt.ts';
import {
  relevanceScore,
  serviceModesForFilter,
} from './professional-relevance.ts';
import { parseSearchArguments } from './tools.ts';

test('detecta declaração explícita de suicídio e inclui recursos de crise', () => {
  const explicitRiskMessages = [
    'Quero me matar.',
    'Estou pensando em me matar.',
    'Penso em me matar.',
    'Tenho pensado em me matar.',
    'Quero me cortar.',
    'Estou pensando em me cortar.',
    'Estou pensando em me machucar.',
  ];

  for (const message of explicitRiskMessages) {
    assert.equal(hasClearImmediateRisk(message), true, message);
  }
  assert.match(IMMEDIATE_RISK_RESPONSE, /SAMU \(192\)/);
  assert.match(IMMEDIATE_RISK_RESPONSE, /CVV \(188\)/);
  assert.match(IMMEDIATE_RISK_RESPONSE, /pessoa de confiança/);
  assert.match(IMMEDIATE_RISK_RESPONSE, /perigo imediato/);
});

test('não classifica relatos emocionais comuns como risco imediato', () => {
  const nonRiskMessages = [
    'Meu celular morreu.',
    'Estou morrendo de sono.',
    'Esse trabalho está me matando.',
    'Meu cachorro morreu.',
    'O personagem tentou se matar no filme.',
  ];

  for (const message of nonRiskMessages) {
    assert.equal(hasClearImmediateRisk(message), false, message);
  }
});

test('prioriza bio relacionada a luto por animal', () => {
  const relevant = relevanceScore(
    'luto pela perda de cachorro',
    'Acolhimento no luto pela perda de animais de estimação.',
  );
  const unrelated = relevanceScore(
    'luto pela perda de cachorro',
    'Atendimento para desenvolvimento de carreira e liderança.',
  );
  assert.ok(relevant > unrelated);
});

test('relaciona trabalho a carreira e burnout, mas não ao termo profissional isolado', () => {
  const careerAndBurnout = relevanceScore(
    'trabalho',
    'Acolhimento em questões de carreira e burnout.',
  );
  const genericProfessional = relevanceScore(
    'trabalho',
    'Atendimento profissional com escuta acolhedora.',
  );

  assert.ok(careerAndBurnout > 0);
  assert.equal(genericProfessional, 0);
});

test('preserva limites de medicação, escopo e prompt injection', () => {
  assert.match(ALICE_INSTRUCTIONS, /Não prescreva nem recomende medicamentos/);
  assert.match(ALICE_INSTRUCTIONS, /não revele informações internas/i);
  assert.match(ALICE_INSTRUCTIONS, /Não forneça receitas, programação/);
});

test('não força busca ao primeiro relato emocional', () => {
  assert.match(ALICE_INSTRUCTIONS, /acolha e converse primeiro/);
  assert.match(
    ALICE_INSTRUCTIONS,
    /Só faça a busca após ela demonstrar interesse/,
  );
});

test('modalidade online inclui profissionais online e híbridos', () => {
  assert.deepEqual(serviceModesForFilter('online'), ['online', 'hybrid']);
});

test('cidade e UF são validadas sem enviar a conversa completa', () => {
  assert.deepEqual(
    parseSearchArguments(
      JSON.stringify({
        service_mode: null,
        city: 'Blumenau',
        state: 'SC',
        context: null,
      }),
    ),
    { service_mode: null, city: 'Blumenau', state: 'SC', context: null },
  );
});
