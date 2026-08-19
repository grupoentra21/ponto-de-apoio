create extension if not exists pgcrypto;
create type public.user_role as enum ('user','professional','admin');
create type public.service_mode as enum ('online','in_person','hybrid');
create type public.message_role as enum ('user','assistant','system');

create table public.profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text,role public.user_role not null default 'user',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.specialties(id uuid primary key default gen_random_uuid(),name text not null unique,slug text not null unique,description text,created_at timestamptz not null default now());
create table public.professionals(id uuid primary key default gen_random_uuid(),profile_id uuid not null unique references public.profiles(id) on delete cascade,professional_type text not null,registration_number text not null,registration_region text not null,bio text,service_mode public.service_mode not null,city text,state char(2),is_verified boolean not null default false,is_published boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(registration_number,registration_region));
create table public.professional_specialties(professional_id uuid not null references public.professionals(id) on delete cascade,specialty_id uuid not null references public.specialties(id) on delete restrict,primary key(professional_id,specialty_id));
create table public.conversations(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id) on delete cascade,title text,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.messages(id uuid primary key default gen_random_uuid(),conversation_id uuid not null references public.conversations(id) on delete cascade,role public.message_role not null,content text not null check(char_length(content) between 1 and 10000),created_at timestamptz not null default now());

create index professionals_published_idx on public.professionals(is_published,service_mode);
create index conversations_user_idx on public.conversations(user_id,created_at desc);
create index messages_conversation_idx on public.messages(conversation_id,created_at);

alter table public.profiles enable row level security;
alter table public.specialties enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_specialties enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Public can read specialties" on public.specialties for select using(true);
create policy "Public can read published professionals" on public.professionals for select using(is_published=true);
create policy "Public can read published professional specialties" on public.professional_specialties for select using(exists(select 1 from public.professionals p where p.id=professional_id and p.is_published=true));
create policy "Users can read own profile" on public.profiles for select using(auth.uid()=id);
create policy "Users can update own profile" on public.profiles for update using(auth.uid()=id) with check(auth.uid()=id);
create policy "Users manage own conversations" on public.conversations for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "Users manage messages in own conversations" on public.messages for all using(exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid())) with check(exists(select 1 from public.conversations c where c.id=conversation_id and c.user_id=auth.uid()));
comment on table public.messages is 'Potentially sensitive content. Define retention, consent and deletion rules before enabling persistence.';
