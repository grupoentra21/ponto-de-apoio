# Ponto de Apoio

Fundação técnica de uma plataforma para acolhimento inicial e encaminhamento a profissionais de saúde mental. A aplicação não diagnostica, não substitui profissionais e não apresenta o assistente como serviço clínico.

## Estado desta etapa

- Landing page responsiva.
- Chat de acolhimento integrado à OpenAI, sem persistência no Ponto de Apoio.
- Catálogo com perfis explicitamente fictícios.
- Clientes Supabase para navegador e servidor.
- Migration PostgreSQL relacional com RLS e políticas iniciais.
- TypeScript estrito, ESLint, Prettier e preparação para Vercel.

## Executar localmente

Requisitos: Node.js 20.9 ou superior e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

As telas funcionam sem Supabase configurado. Para integrar dados, preencha sem versionar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Para habilitar o chat, adicione a chave da OpenAI ao `.env.local`:

```env
OPENAI_API_KEY=sk-exemplo
```

A chave é lida apenas pelo endpoint no servidor e nunca deve usar o prefixo
`NEXT_PUBLIC_`. Reinicie `npm run dev` depois de criar ou alterar o arquivo.

Nunca adicione chaves reais ao Git. Chaves de serviço nunca devem chegar ao navegador.

## Banco de dados

A migration em `supabase/migrations/20260819000000_initial_schema.sql` cria `profiles`, `professionals`, `specialties`, a relação N:N `professional_specialties`, `conversations` e `messages`. Todas têm RLS habilitado. Somente especialidades e profissionais publicados são públicos; perfil e conversas ficam restritos ao próprio usuário.

Antes de produção, revise papéis administrativos, verificação profissional, consentimento, retenção e exclusão de conteúdo sensível.

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
supabase gen types typescript --linked > src/types/database.generated.ts
```

## Comandos

```bash
npm run dev
npm run lint
npm run build
npm run format:check
```

## Estrutura

```text
src/app/               rotas do App Router
src/components/        interface por domínio
src/lib/mocks/         dados demonstrativos
src/lib/supabase/      clientes Supabase
src/types/             tipos compartilhados
supabase/migrations/   evolução do PostgreSQL
```

## Deploy futuro

Importe o repositório na Vercel, configure as variáveis por ambiente e use o build padrão do Next.js. Separe os projetos Supabase de desenvolvimento, homologação e produção.

## Próximas etapas

1. Definir privacidade, consentimento e protocolo para situações de risco com especialistas responsáveis.
2. Configurar autenticação e criação segura de perfis.
3. Criar painel e processo de verificação de profissionais.
4. Evoluir o assistente com avaliação de segurança e encaminhamento — sem diagnóstico.
5. Adicionar testes, auditoria de acessibilidade e monitoramento.

Em risco imediato, procure o SAMU (192), uma emergência local ou o CVV (188). Valide a disponibilidade dos serviços para cada região atendida.
