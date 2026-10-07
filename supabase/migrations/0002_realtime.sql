-- Habilita Realtime (postgres_changes) para as tabelas que mudam durante o
-- serviço, para os aparelhos se verem em ~1 segundo. Execute no SQL Editor.

do $$
declare
  t text;
  tabelas text[] := array[
    'orders','orderItems','payments','cashSessions','cashMovements','mesas'
  ];
begin
  foreach t in array tabelas loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;
