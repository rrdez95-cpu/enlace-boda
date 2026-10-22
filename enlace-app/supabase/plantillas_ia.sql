-- Enlace · cuenta de plantillas creadas con IA (límite diario por usuario)
-- Ejecutar una vez en Supabase → SQL Editor
create table if not exists public.plantillas_ia (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  created_at timestamptz not null default now()
);
create index if not exists plantillas_ia_user_fecha on public.plantillas_ia (user_id, created_at desc);
-- Sin políticas: solo el servidor (service role) lee y escribe
alter table public.plantillas_ia enable row level security;
