# Ponto de Apoio

Fundação técnica de uma plataforma para acolhimento inicial e encaminhamento a profissionais de saúde mental. A aplicação não diagnostica, não substitui profissionais e não apresenta o assistente como serviço clínico.

## Estado desta etapa

- Landing page responsiva.
- Chat demonstrativo sem API de IA nem persistência.
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Encontre ambos em **Connect** no projeto Supabase. A URL e a chave
`Publishable` (`sb_publishable_...`) são públicas e podem ser usadas pelo
navegador; a proteção dos dados depende de permissões e RLS. Nunca adicione
chaves reais ao Git. Chaves `Secret`, `service_role`, senha do banco e tokens
de acesso pessoal devem permanecer somente em ambientes de servidor e não são
necessários nesta etapa.

### Verificar a conexão

Depois de configurar `.env.local`, aplicar as migrations e iniciar a aplicação,
acesse:

```text
http://localhost:3000/api/health/supabase
```

Uma conexão funcional retorna `200` com `{"status":"ok"}`. Configuração
ausente, indisponibilidade ou schema ainda não aplicado retorna `503` sem expor
detalhes do banco. O endpoint roda somente no servidor e faz uma consulta sem
retornar linhas da tabela `specialties`.

## Banco de dados

A migration em `supabase/migrations/20260819000000_initial_schema.sql` cria `profiles`, `professionals`, `specialties`, a relação N:N `professional_specialties`, `conversations` e `messages`. Todas têm RLS habilitado. Somente especialidades e profissionais publicados são públicos; perfil e conversas ficam restritos ao próprio usuário.

Antes de produção, revise papéis administrativos, verificação profissional, consentimento, retenção e exclusão de conteúdo sensível.

```bash
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.generated.ts
```

O `project-ref` aparece na URL do Dashboard (`/project/<project-ref>`). O
comando `link` pede a senha do banco, definida na criação do projeto; não a
salve no repositório. Antes de enviar migrations a um banco que já tenha sido
alterado pelo Dashboard, use `npx supabase db pull` para reconciliar o histórico.

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
4. Integrar assistente com limites claros, avaliação de segurança e encaminhamento — sem diagnóstico.
5. Adicionar testes, auditoria de acessibilidade e monitoramento.

Em risco imediato, procure o SAMU (192), uma emergência local ou o CVV (188). Valide a disponibilidade dos serviços para cada região atendida.
