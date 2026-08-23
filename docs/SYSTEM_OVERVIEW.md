# Visão geral do Ponto de Apoio

## Propósito atual

O Ponto de Apoio está sendo preparado como um catálogo de psicólogos verificados. A plataforma permite que profissionais criem uma conta, enviem dados profissionais para análise e sejam publicados somente depois de uma decisão administrativa.

A identidade visual fica versionada em `public/brand/`: a marca verde é usada em superfícies claras, a marca branca fica disponível para superfícies escuras e o símbolo isolado atende favicon e atalhos da aplicação.

O produto não presta atendimento psicológico, não emite diagnóstico e não é um serviço de emergência. A tela de acolhimento usa a OpenAI para orientação inicial com limites explícitos; a chave permanece no servidor e as mensagens não são persistidas pelo Ponto de Apoio.

## Estado por ambiente

### Branch `codex/admin-portal-production`

- autenticação de psicólogos implementada;
- painel administrativo implementado;
- área profissional implementada;
- catálogo conectado ao Supabase implementado;
- chat OpenAI preservado e executado somente por `/api/chat`;
- identidade visual oficial aplicada;
- migration PostgreSQL e RLS preparadas;
- lint, formatação, TypeScript e build aprovados.

### Produção antes do merge desta branch

- `https://ponto-de-apoio.vercel.app/`: disponível;
- `/admin`: ainda retorna 404;
- `/cadastro-profissional`: ainda retorna 404;
- `/api/health/supabase`: retorna 503 porque o schema ainda não foi aplicado;
- a branch administrativa já está no GitHub e aguarda PR, migration e validação final.

## Perfis de acesso

| Papel         | Capacidades                                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Visitante     | Ver somente profissionais aprovados e publicados; acessar a demonstração de acolhimento.                           |
| Psicólogo     | Criar conta, confirmar e-mail, entrar, preencher o próprio cadastro e enviá-lo para verificação.                   |
| Administrador | Visualizar todos os cadastros, aprovar, solicitar revisão, suspender, restaurar e excluir o cadastro profissional. |

O papel administrativo nunca é aceito a partir de dados enviados pelo navegador. O primeiro administrador deve ser promovido manualmente por uma pessoa autorizada no SQL Editor do Supabase.

## Fluxo do psicólogo

1. Acessa `/cadastro-profissional`.
2. Informa nome, e-mail e senha com no mínimo oito caracteres.
3. O Supabase Auth cria o usuário e envia a confirmação de e-mail, se ela estiver habilitada.
4. O trigger `handle_new_user` cria `public.profiles` com papel `professional`.
5. Depois do login, `/area-profissional` exige uma sessão válida.
6. O profissional informa CRP, região, modalidade, cidade, UF, contato e apresentação.
7. O cadastro é salvo como `pending_review` e permanece fora do catálogo.
8. Depois da aprovação administrativa, passa a `approved` e `is_published = true`.

Perfis aprovados ou suspensos ficam bloqueados para edição pelo profissional. Mudanças nesses estados dependem da equipe administrativa.

## Fluxo administrativo

1. O administrador entra pela mesma rota `/entrar`.
2. A aplicação consulta `public.profiles.role` no servidor.
3. Contas com papel `admin` são encaminhadas a `/admin`.
4. O painel mostra totais e todos os cadastros permitidos pelas políticas RLS.
5. Aprovar publica o perfil; rejeitar devolve para revisão; suspender remove do catálogo; restaurar republica.
6. Excluir apaga o registro de `public.professionals`, mas preserva a conta do Supabase Auth.
7. Cada decisão é registrada em `public.admin_audit_logs`.

Para um profissional que não pode mais atuar, a ação recomendada é **suspender**, pois mantém o registro e a trilha histórica. A exclusão deve ser reservada a cadastro duplicado, inválido ou a uma solicitação legítima de eliminação.

## Rotas da aplicação

| Rota                     | Finalidade                                             | Acesso          |
| ------------------------ | ------------------------------------------------------ | --------------- |
| `/`                      | Página institucional                                   | Público         |
| `/acolhimento`           | Acolhimento inicial assistido por IA, sem persistência | Público         |
| `/profissionais`         | Catálogo vindo do PostgreSQL                           | Público         |
| `/cadastro-profissional` | Criação de conta                                       | Público         |
| `/entrar`                | Login                                                  | Público         |
| `/auth/callback`         | Troca segura do código de confirmação por sessão       | Público/técnico |
| `/area-profissional`     | Cadastro e status do próprio psicólogo                 | Autenticado     |
| `/admin`                 | Operação do catálogo                                   | Administrador   |
| `/api/health/supabase`   | Verificação sem retorno de dados                       | Servidor        |
| `/api/chat`              | Proxy servidor para a OpenAI                           | Servidor        |

## Arquitetura

```text
Navegador
   │
   ├── páginas públicas do Next.js
   ├── Supabase Auth (chave publicável)
   └── sessão em cookies HTTP
            │
Next.js App Router + Server Actions + Proxy de sessão
            │
Supabase API
            │
PostgreSQL + Row Level Security
```

O projeto utiliza Next.js App Router, React, TypeScript, `@supabase/ssr` e `@supabase/supabase-js`. A sessão é atualizada pelo Proxy do Next.js e as páginas protegidas validam o usuário no servidor.

## Fora do escopo atual

- prontuário ou anotações clínicas;
- armazenamento de conversas de acolhimento;
- diagnóstico ou triagem automática;
- agenda, pagamento ou assinatura;
- validação automática do CRP;
- upload de documentos;
- redefinição de senha pela interface;
- autenticação multifator;
- exclusão de contas do Supabase Auth pelo painel.

Esses itens exigem modelagem, políticas, testes e decisões operacionais próprias antes de serem ativados.
