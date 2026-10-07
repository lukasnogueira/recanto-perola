-- Recanto Pérola — schema de sincronização (Fase 8)
-- Execute este arquivo no SQL Editor do Supabase.
-- Os nomes de coluna seguem o mesmo padrão do app (camelCase) para o cliente
-- gravar/ler os objetos sem conversão. Sincronização é "last-write-wins" por updatedAt.

create table if not exists public.operators (
  id text primary key,
  nome text,
  role text,
  ativo integer default 1,
  salt text,
  "pinHash" text,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.categories (
  id text primary key,
  nome text,
  ordem integer default 0,
  ativo integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.products (
  id text primary key,
  "categoryId" text,
  nome text,
  preco double precision default 0,
  ativo integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.mesas (
  id text primary key,
  numero integer,
  nome text,
  area text,
  status text,
  ativo integer default 1,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.orders (
  id text primary key,
  tipo text,
  status text,
  "tableId" text,
  "mesaNumero" integer,
  "mesaNome" text,
  "clienteNome" text,
  "clienteTelefone" text,
  endereco text,
  "taxaEntrega" double precision default 0,
  desconto double precision default 0,
  observacao text,
  subtotal double precision default 0,
  total double precision default 0,
  "itemsCount" integer default 0,
  "createdAt" bigint,
  "updatedAt" bigint,
  "closedAt" bigint,
  "cashSessionId" text,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public."orderItems" (
  id text primary key,
  "orderId" text,
  "productId" text,
  nome text,
  preco double precision default 0,
  quantidade integer default 1,
  observacao text,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.payments (
  id text primary key,
  "orderId" text,
  metodo text,
  valor double precision default 0,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public."cashSessions" (
  id text primary key,
  status text,
  "valorAbertura" double precision default 0,
  "operadorId" text,
  "operadorNome" text,
  "openedAt" bigint,
  "closedAt" bigint,
  "valorContado" double precision default 0,
  diferenca double precision default 0,
  observacao text,
  "resumoFechamento" jsonb,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public."cashMovements" (
  id text primary key,
  "cashSessionId" text,
  tipo text,
  valor double precision default 0,
  observacao text,
  "createdAt" bigint,
  "updatedAt" bigint,
  deleted integer default 0,
  "deviceId" text
);

create table if not exists public.settings (
  key text primary key,
  value jsonb,
  "updatedAt" bigint,
  "deviceId" text
);

-- RLS: permite acesso total a usuários autenticados (inclui login anônimo).
do $$
declare
  t text;
  tabelas text[] := array[
    'operators','categories','products','mesas','orders','orderItems',
    'payments','cashSessions','cashMovements','settings'
  ];
begin
  foreach t in array tabelas loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "acesso autenticado" on public.%I', t);
    execute format(
      'create policy "acesso autenticado" on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

-- Observação: habilite "Anonymous sign-ins" em Authentication > Providers,
-- para que o app (sem tela de login em nuvem) consiga sincronizar.
