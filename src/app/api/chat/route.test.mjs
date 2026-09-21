import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import { professionalIdPattern } from '../../../lib/chat-recommendations.ts';

const source = await readFile(new URL('./route.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const id = '11111111-1111-4111-8111-111111111111';

function loadRoute({
  search = async () => ({ professionals: [] }),
  details = async () => [],
  risk = false,
  model = async () => ({ output: [], output_text: 'Resposta comum' }),
} = {}) {
  const exports = {};
  const imports = {
    openai: {
      default: class {
        responses = { create: model };
      },
    },
    'next/server': {
      NextResponse: { json: (body, init) => Response.json(body, init) },
    },
    '@/ai/alice-prompt': { ALICE_INSTRUCTIONS: 'Instruções de teste' },
    '@/ai/alice-safety': {
      hasClearImmediateRisk: () => risk,
      IMMEDIATE_RISK_RESPONSE: 'Protocolo de crise',
    },
    '@/ai/tools': {
      parseSearchArguments: JSON.parse,
      PROFESSIONAL_SEARCH_TOOL: {},
    },
    '@/services/professional-search': {
      searchProfessionals: search,
      getChatProfessionals: details,
    },
    '@/lib/chat-recommendations': { professionalIdPattern },
  };
  vm.runInNewContext(compiled, {
    exports,
    require: (name) => {
      if (!(name in imports)) throw new Error(name);
      return imports[name];
    },
    process: { env: { OPENAI_API_KEY: 'test-only' } },
    console,
    URL,
    Set,
  });
  return exports;
}
const request = () =>
  new Request('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'Quero conhecer profissionais' }],
    }),
  });

test('busca retorna cartões somente com profissionais vindos do catálogo', async () => {
  let calls = 0;
  const route = loadRoute({
    model: async () => {
      calls++;
      return {
        output: [
          {
            type: 'function_call',
            name: 'buscar_profissionais',
            arguments: '{}',
            call_id: '1',
          },
        ],
      };
    },
    search: async () => ({
      professionals: [
        {
          id,
          name: 'Nome público',
          reason: 'Motivo baseado no perfil',
          contact_email: 'nao-enviar@example.com',
        },
      ],
    }),
  });
  const response = await route.POST(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.recommendations, [
    { id, name: 'Nome público', reason: 'Motivo baseado no perfil' },
  ]);
  assert.equal(calls, 1);
  assert.equal(JSON.stringify(body).includes('nao-enviar'), false);
});

test('protocolo de crise precede qualquer chamada de modelo ou busca', async () => {
  const route = loadRoute({
    risk: true,
    model: () => {
      throw new Error('Não deve chamar o modelo');
    },
  });
  assert.deepEqual(await (await route.POST(request())).json(), {
    message: 'Protocolo de crise',
  });
});

test('endpoint de detalhes rejeita identificadores inválidos e lotes excessivos', async () => {
  let calls = 0;
  const route = loadRoute({
    details: async () => {
      calls++;
      return [];
    },
  });
  const tooMany = Array.from(
    { length: 9 },
    (_, i) => `11111111-1111-4111-8111-${String(i).padStart(12, '0')}`,
  ).join(',');
  for (const query of ['', '../admin', tooMany])
    assert.equal(
      (
        await route.GET(
          new Request(`http://localhost/api/chat?professionals=${query}`),
        )
      ).status,
      400,
    );
  assert.equal(calls, 0);
});

test('perfil retirado do catálogo não é reconstruído a partir da conversa', async () => {
  const route = loadRoute({
    details: async (ids) => {
      assert.deepEqual(Array.from(ids), [id]);
      return [];
    },
  });
  const response = await route.GET(
    new Request(`http://localhost/api/chat?professionals=${id}`),
  );
  assert.deepEqual(await response.json(), { professionals: [] });
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
