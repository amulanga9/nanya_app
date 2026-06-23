-- Nanya app schema (MVP, no auth, anon read/write)

create table if not exists windows (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  location text not null,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references windows(id) on delete cascade,
  start_time time not null,
  end_time time not null,
  children jsonb not null default '[]',
  children_count int not null default 0,
  parent_phone text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists bookings_window_id_idx on bookings(window_id);
create index if not exists bookings_parent_phone_idx on bookings(parent_phone);

alter table windows enable row level security;
alter table bookings enable row level security;

-- MVP: open anon access, no Supabase Auth.
create policy "anon read windows" on windows for select using (true);
create policy "anon write windows" on windows for insert with check (true);
create policy "anon update windows" on windows for update using (true);
create policy "anon delete windows" on windows for delete using (true);

create policy "anon read bookings" on bookings for select using (true);
create policy "anon write bookings" on bookings for insert with check (true);
create policy "anon update bookings" on bookings for update using (true);

alter publication supabase_realtime add table windows;
alter publication supabase_realtime add table bookings;
