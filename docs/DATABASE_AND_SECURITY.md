# Banco de dados e segurança

## Modelo PostgreSQL

### `profiles`

Relaciona uma conta de `auth.users` ao nome e ao papel da aplicação.

- `id`: mesmo UUID do Supabase Auth;
- `full_name`: nome exibido;
- `role`: `user`, `professional` ou `admin`;
- `created_at` e `updated_at`: auditoria temporal.

O usuário pode atualizar somente `full_name` e `updated_at`. Mesmo autenticado, ele não possui privilégio SQL para alterar `role`.

### `professionals`

Mantém os dados destinados ao catálogo:

- vínculo exclusivo com `profiles`;
- tipo profissional;
- número e região do registro;
- apresentação;
- modalidade;
- cidade e UF;
- e-mail profissional;
- estado de verificação e publicação;
- administrador e data da última revisão.

O banco impede que um cadastro seja publicado sem estar aprovado.

### `admin_audit_logs`

Registra aprovação, rejeição, suspensão, restauração e exclusão. Não existe política de atualização ou exclusão dessa tabela pela aplicação, tornando a trilha imutável para usuários comuns e administradores do painel.

## Estados do cadastro

```text
draft ───────────────┐
                     ▼
              pending_review
                │         │
                ▼         ▼
            approved   rejected
                │         │
                ▼         └── novo envio ──► pending_review
            suspended
                │
                └── restauração ──► approved
```

Somente `approved` com `is_published = true` é visível publicamente.

## Políticas RLS

- visitantes leem somente cadastros aprovados e publicados;
- o nome público é liberado somente quando existe um cadastro publicado associado;
- psicólogos leem o próprio perfil e o próprio cadastro;
- psicólogos criam apenas cadastro próprio e não podem autopublicar;
- psicólogos editam somente estados ainda não aprovados;
- administradores são reconhecidos pela função protegida `public.is_admin()`;
- somente administradores alteram estados ou excluem cadastros;
- somente administradores leem e criam registros de auditoria.

A função `is_admin` usa `security definer` com `search_path` vazio para evitar recursão nas políticas e reduzir riscos de resolução indevida de objetos.

## Variáveis de ambiente

### Públicas

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

A URL do projeto e a chave `Publishable` são apropriadas para o navegador. Elas não concedem acesso irrestrito; o controle real é feito por autenticação, privilégios PostgreSQL e RLS.

### Segredos que não devem ser usados no navegador

- `service_role`;
- chave `Secret` do Supabase;
- senha do PostgreSQL;
- token pessoal do Supabase;
- chaves de provedores de pagamento ou OpenAI.

O fluxo atual não precisa de `service_role`. Operações administrativas usam a sessão do administrador e continuam submetidas às políticas RLS.

## Decisões de privacidade

- não existe tabela de conversas;
- dados profissionais estão separados de qualquer futuro dado de acolhimento;
- documentos pessoais não são aceitos nesta versão;
- o health check não retorna linhas nem mensagens internas do banco;
- erros exibidos no login não confirmam se determinado e-mail está cadastrado;
- logs da aplicação não devem receber CRP, biografia, tokens ou conteúdo sensível.

## Controles ainda recomendados

Antes de uma operação comercial completa:

1. habilitar MFA para administradores;
2. implantar recuperação de senha;
3. definir processo de validação periódica do CRP;
4. criar política formal de retenção e exclusão;
5. restringir e monitorar tentativas de login;
6. configurar alertas e resposta a incidentes;
7. adicionar testes automatizados das políticas RLS;
8. executar revisão jurídica, LGPD e ética profissional;
9. utilizar ambientes Supabase separados para homologação e produção;
10. revisar a exposição do e-mail profissional antes do lançamento.
