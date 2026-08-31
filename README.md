# Ponto de Apoio

Fundação técnica de uma plataforma para acolhimento inicial e encaminhamento a profissionais de saúde mental. A aplicação não diagnostica, não substitui profissionais e não apresenta o assistente como serviço clínico.

## Documentação

- [Visão geral, fluxos e estado dos ambientes](docs/SYSTEM_OVERVIEW.md)
- [Modelo PostgreSQL, RLS e segurança](docs/DATABASE_AND_SECURITY.md)
- [Implantação e operação administrativa](docs/OPERATIONS.md)

> **Estado de publicação:** a área administrativa, o cadastro profissional e a base PostgreSQL com RLS estão publicados em produção.

## Estado desta etapa

- Landing page responsiva.
- Chat de acolhimento integrado à OpenAI no servidor, sem persistência de mensagens.
- Busca assistida no chat que consulta somente profissionais aprovados e publicados.
- Clientes Supabase para navegador e servidor.
- Autenticação por e-mail e senha para psicólogos.
- Área profissional para envio do cadastro à verificação.
- Área administrativa para aprovar, suspender, restaurar ou excluir cadastros.
- Catálogo público alimentado somente por perfis aprovados no PostgreSQL.
- Identidade visual oficial aplicada no cabeçalho, metadados sociais e ícone da aplicação.
- Migration PostgreSQL relacional com RLS e auditoria administrativa.
- TypeScript estrito, ESLint, Prettier e preparação para Vercel.

## Executar localmente

Requisitos: Node.js 22 ou superior e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

As telas funcionam sem Supabase configurado. Para integrar dados, preencha sem versionar:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=
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
retornar linhas da tabela `professionals`.

## Banco de dados e primeiro administrador

A migration em `supabase/migrations/20260819000000_initial_schema.sql` cria os perfis, cadastros profissionais e a trilha de auditoria. O catálogo só lê profissionais aprovados e publicados. O papel administrativo não pode ser escolhido no cadastro público.

Depois de criar uma conta normalmente, promova somente a conta da pessoa responsável pelo painel usando o SQL Editor do Supabase:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (select id from auth.users where email = 'ADMIN@EXEMPLO.COM');
```

Em **Authentication → URL Configuration**, defina a URL de produção e adicione `https://SEU-DOMINIO/auth/callback` às URLs de redirecionamento. Mantenha a confirmação de e-mail habilitada.

Para a confirmação de cadastro funcionar com SSR mesmo quando o e-mail for
aberto em outro navegador, configure o template **Authentication → Email
Templates → Confirm sign up** com um link baseado em `token_hash`:

```html
<a
  href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email&next=/area-profissional"
>
  Confirmar e-mail
</a>
```

O callback valida esse token no Supabase com o tipo `email`. Em caso de
confirmação válida, direciona para a área profissional quando uma sessão é
criada ou mostra uma mensagem positiva na página de entrada.

Para a recuperação funcionar mesmo quando o e-mail é aberto em outro
navegador, configure o template **Authentication → Email Templates → Reset
Password** com um link baseado em `token_hash`:

```html
<a
  href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=/definir-senha"
>
  Definir nova senha
</a>
```

A rota aceita `email` para confirmação e `recovery` para redefinição de senha,
em tratamentos separados. O parâmetro `next` continua restrito a caminhos
internos, evitando redirecionamentos para outros domínios.

Antes de produção, revise papéis administrativos, verificação profissional, consentimento, retenção e exclusão de conteúdo sensível.

## Busca de profissionais pelo chat

Quando uma pessoa pede opções de atendimento, a rota `/api/chat` pode chamar a
ferramenta interna `buscar_profissionais`. A consulta é executada no servidor e
aplica obrigatoriamente `status = approved` e `is_published = true`, além dos
filtros opcionais de modalidade, cidade e UF.

A OpenAI recebe somente nome público, CRP, apresentação, modalidade e
localização. E-mail, identificadores internos, dados administrativos e qualquer
dado de acolhimento não são incluídos. Os resultados usam rotação diária neutra
e devem ser apresentados como opções compatíveis, não como ranking, diagnóstico
ou recomendação clínica. A RLS continua sendo a última camada de autorização.

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

## Deploy

O repositório está conectado à Vercel. Configure as variáveis por ambiente e use o build padrão do Next.js. Separe os projetos Supabase de desenvolvimento, homologação e produção.

## Próximas etapas

1. Definir privacidade, consentimento e protocolo para situações de risco com especialistas responsáveis.
2. Validar cadastro, aprovação e publicação ponta a ponta.
3. Adicionar testes automatizados, auditoria de acessibilidade e monitoramento.

Em risco imediato, procure o SAMU (192), uma emergência local ou o CVV (188). Valide a disponibilidade dos serviços para cada região atendida.
