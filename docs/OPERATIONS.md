# Manual de implantação e operação

## 1. Pré-requisitos

- Node.js 22 ou superior;
- projeto Supabase `ponto-de-apoio`;
- projeto Vercel conectado ao repositório correto;
- acesso de escrita ao repositório `grupoentra21/ponto-de-apoio`;
- acesso autorizado ao SQL Editor e às configurações de Auth do Supabase.

## 2. Configuração local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` sem versioná-lo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
```

As duas primeiras informações ficam no botão **Connect** do projeto Supabase. Use a chave publicável atual, nunca `service_role` ou uma chave secreta.

## 3. Aplicação das migrations

Antes de aplicar, confirme se o banco ainda não recebeu alterações manuais incompatíveis.

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

As migrations versionadas ficam em `supabase/migrations/`. Em um banco que já possua objetos com os mesmos nomes, não execute o SQL às cegas: faça `supabase db pull`, compare o histórico e produza uma migration incremental.

## 4. Configuração do Supabase Auth

Em **Authentication → URL Configuration**:

- Site URL de produção: `https://pontodeapoio.social.br`;
- Redirect URL: `https://pontodeapoio.social.br/auth/callback`;
- desenvolvimento: `http://localhost:3000/auth/callback`.

Mantenha a confirmação de e-mail habilitada. O subdomínio `auth.pontodeapoio.social.br` está validado no Resend e o SMTP próprio está configurado no Supabase. O template de recuperação deve apontar para `/auth/callback` usando `token_hash` do tipo `recovery`.

## 5. Primeiro administrador

O administrador deve primeiro criar e confirmar uma conta pela interface. Depois, uma pessoa autorizada executa no SQL Editor:

```sql
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id from auth.users
  where email = 'ADMIN@EXEMPLO.COM'
);
```

Confirme o resultado:

```sql
select p.id, p.full_name, p.role, u.email
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
```

Nunca ofereça uma opção de cadastro administrativo na interface pública.

## 6. Configuração da Vercel

Adicione em **Settings → Environment Variables**, para Production e Preview conforme necessário:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=https://pontodeapoio.social.br
OPENAI_API_KEY=sk-...
```

Defina Node.js 22 ou deixe a Vercel respeitar o campo `engines` do `package.json`. Após modificar variáveis, faça um novo deploy.

## 7. Validação após o deploy

1. Acesse `/api/health/supabase`; deve responder `200` e `{"status":"ok"}`.
2. Crie uma conta de teste em `/cadastro-profissional`.
3. Confirme o e-mail e entre.
4. Envie um cadastro; ele não deve aparecer publicamente.
5. Entre como administrador e aprove o cadastro.
6. Confirme que ele aparece em `/profissionais`.
7. Suspenda o cadastro e confirme que desaparece imediatamente.
8. Restaure e confirme a republicação.
9. Verifique `admin_audit_logs` no Table Editor.
10. No chat, peça psicólogos online e confirme que somente registros `approved` e publicados aparecem.
11. Teste cidade, UF e modalidade sem informar dados pessoais ou conteúdo clínico.
12. Confirme que a resposta não contém e-mail, UUID ou informações administrativas.

Faça os testes com registros explicitamente marcados como teste e remova-os antes do lançamento.

### Critérios para a busca assistida

- um cadastro pendente, rejeitado ou suspenso nunca deve aparecer;
- um cadastro aprovado com `is_published = false` nunca deve aparecer;
- a IA não pode inventar resultados quando a consulta retorna vazia;
- a ordem deve ser descrita como neutra, sem avaliação de qualidade;
- a resposta não deve ser apresentada como diagnóstico, indicação clínica ou confirmação de disponibilidade;
- falhas no Supabase devem resultar em mensagem genérica, sem detalhes internos.

## 8. Operação administrativa

### Aprovar

Use somente depois de conferir identidade, situação do CRP e coerência das informações. A aprovação define `approved` e publica imediatamente.

### Solicitar revisão

Retorna o cadastro para `rejected`, sem publicação. O profissional pode corrigir e enviar novamente.

### Suspender

Retira imediatamente do catálogo e bloqueia edição pelo profissional. É a ação padrão para impedimento temporário ou dúvida sobre a regularidade.

### Restaurar

Retorna um cadastro suspenso a `approved` e o publica novamente. Exige nova conferência administrativa.

### Excluir

Remove o registro profissional, mas não a conta de autenticação. Use somente quando a preservação do cadastro não for necessária. A ação é confirmada na interface e auditada.

## 9. Comandos de qualidade

```bash
npm run format:check
npm run lint
npm run build
```

Não existe suíte automatizada de testes nesta versão. O build valida TypeScript e rotas, mas não substitui testes de integração, RLS e interface.

## 10. Incidentes e rollback

- para retirar um profissional: suspenda, não exclua;
- para incidente de autenticação: desabilite o usuário no Supabase Auth e investigue os logs;
- para vazamento de segredo: rotacione imediatamente no provedor e na Vercel;
- para regressão de deploy: use o rollback da Vercel para o último deployment saudável;
- para mudança de banco: não apague tabelas nem reverta migration destrutivamente sem backup e plano aprovado.

O Git e o deploy não substituem backup do PostgreSQL. Verifique a política de backups disponível no plano Supabase contratado.
