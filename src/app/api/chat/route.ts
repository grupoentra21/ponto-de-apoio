import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ALICE_INSTRUCTIONS } from '@/ai/alice-prompt';
import {
  hasClearImmediateRisk,
  IMMEDIATE_RISK_RESPONSE,
} from '@/ai/alice-safety';
import { parseSearchArguments, PROFESSIONAL_SEARCH_TOOL } from '@/ai/tools';
import {
  searchProfessionals,
  getChatProfessionals,
} from '@/services/professional-search';
import {
  professionalIdPattern,
  type ChatRecommendation,
} from '@/lib/chat-recommendations';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== 'object' || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    message.content.trim().length > 0 &&
    message.content.length <= 10_000
  );
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const messages =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).messages
        : null;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 50 ||
      !messages.every(isChatMessage)
    ) {
      return NextResponse.json(
        { error: 'Envie uma conversa válida.' },
        { status: 400 },
      );
    }

    const latestUserMessage = [...messages]
      .reverse()
      .find((message) => message.role === 'user');
    if (latestUserMessage && hasClearImmediateRisk(latestUserMessage.content)) {
      return NextResponse.json({ message: IMMEDIATE_RISK_RESPONSE });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não está configurada.');
      return NextResponse.json(
        { error: 'O chat está temporariamente indisponível.' },
        { status: 503 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    // Doze mensagens mantêm continuidade em conversas curtas sem crescimento
    // indefinido do contexto enviado ao provedor.
    const recentMessages = messages.slice(-12);
    let response = await openai.responses.create({
      model: 'gpt-5.4',
      instructions: ALICE_INSTRUCTIONS,
      input: recentMessages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
      tools: [PROFESSIONAL_SEARCH_TOOL],
      max_output_tokens: 500,
    });

    for (let round = 0; round < 2; round += 1) {
      const recommendations: ChatRecommendation[] = [];
      const calls = response.output.filter(
        (item) => item.type === 'function_call',
      );
      if (calls.length === 0) break;

      const outputs = await Promise.all(
        calls.map(async (call) => {
          if (call.name !== 'buscar_profissionais') {
            throw new Error(`Ferramenta não permitida: ${call.name}`);
          }
          const result = await searchProfessionals(
            parseSearchArguments(call.arguments),
          );
          for (const professional of result.professionals) {
            if (
              !recommendations.some((item) => item.id === professional.id) &&
              recommendations.length < 8
            ) {
              recommendations.push({
                id: professional.id,
                name: professional.name,
                reason: professional.reason,
              });
            }
          }
          return {
            type: 'function_call_output' as const,
            call_id: call.call_id,
            output: JSON.stringify(result),
          };
        }),
      );

      if (recommendations.length) {
        return NextResponse.json({
          message:
            'Encontrei estas opções a partir dos critérios informados. Nos cartões, você pode conhecer a apresentação de cada profissional e entender a relação com sua busca. A compatibilidade se baseia nas informações públicas e não representa avaliação de qualidade, indicação clínica ou garantia de adequação.',
          recommendations,
        });
      }

      response = await openai.responses.create({
        model: 'gpt-5.4',
        instructions: ALICE_INSTRUCTIONS,
        previous_response_id: response.id,
        input: outputs,
        tools: [PROFESSIONAL_SEARCH_TOOL],
        max_output_tokens: 500,
      });
    }

    const reply = response.output_text.trim();
    if (!reply) {
      throw new Error('A OpenAI retornou uma resposta vazia.');
    }

    return NextResponse.json({ message: reply });
  } catch (error) {
    console.error('Falha ao responder no chat de acolhimento:', error);
    return NextResponse.json(
      { error: 'Não foi possível responder agora. Tente novamente.' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const ids = [
    ...new Set(
      new URL(request.url).searchParams.get('professionals')?.split(',') ?? [],
    ),
  ];
  if (
    !ids.length ||
    ids.length > 8 ||
    !ids.every((id) => professionalIdPattern.test(id))
  ) {
    return NextResponse.json({ error: 'Perfis inválidos.' }, { status: 400 });
  }
  try {
    return NextResponse.json(
      { professionals: await getChatProfessionals(ids) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar os perfis. Tente novamente.' },
      { status: 503 },
    );
  }
}
