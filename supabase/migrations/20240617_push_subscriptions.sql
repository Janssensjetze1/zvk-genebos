-- Push subscriptions voor web push notificaties
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  endpoint     text not null unique,
  subscription jsonb not null,
  created_at   timestamptz default now()
);

-- Index voor snel ophalen per user
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);

-- RLS
alter table push_subscriptions enable row level security;

-- Gebruikers kunnen hun eigen subscriptions beheren
create policy "Users can manage own push subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role kan alles lezen (voor Edge Function)
create policy "Service role reads all push subscriptions"
  on push_subscriptions for select
  using (true);
