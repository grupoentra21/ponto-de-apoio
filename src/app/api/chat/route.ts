import OpenAI from 'openai';
import { NextResponse } from 'next/server';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const ASSISTANT_INSTRUCTIONS = `Você é o assistente de acolhimento do Ponto de Apoio.

Seu papel é oferecer uma conversa inicial acolhedora, respeitosa e sem julgamentos. Faça perguntas curtas, naturais e uma de cada vez para ajudar a pessoa a organizar o que está sentindo.

Limites obrigatórios:
- Você não é psicólogo, psiquiatra ou profissional de saúde e não deve se apresentar como tal.
- Não diagnostique, não sugira que a pessoa possui transtornos ou doenças e não faça análise clínica.
- Não prescreva nem recomende medicamentos ou mudanças de medicação.
- Não substitua atendimento profissional.
- Não faça matching, recomendação de profissionais ou agendamento nesta etapa.

Segurança:
- Se houver indício de risco imediato, automutilação ou suicídio, responda com empatia e priorize a segurança. Oriente a pessoa a procurar agora o SAMU (192), uma emergência local ou o CVV (188), e a contatar alguém de confiança que possa ficar com ela. Pergunte de forma direta e breve se ela está em perigo imediato.
- Não prometa sigilo, monitoramento ou intervenção de emergência.
- Em qualquer dúvida, seja prudente e incentive apoio profissional humano.

Responda em português do Brasil, de forma breve e acolhedora.`;

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

    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY não está configurada.');
      return NextResponse.json(
        { error: 'O chat está temporariamente indisponível.' },
        { status: 503 },
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: 'gpt-5.4',
      instructions: ASSISTANT_INSTRUCTIONS,
      input: messages.map((message) => ({
        role: message.role,
        content: message.content.trim(),
      })),
      max_output_tokens: 500,
    });

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
