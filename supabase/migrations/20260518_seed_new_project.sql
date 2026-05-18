create extension if not exists pgcrypto;

do $$
begin
  create type public.app_role as enum ('admin', 'mitra');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.settings (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  saldo_awal numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tagihan (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  nama text not null,
  jumlah numeric not null,
  status text not null default 'belum_lunas' check (status in ('belum_lunas', 'lunas')),
  nama_input text,
  nama_lunas text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  username text not null unique,
  created_by uuid references auth.users(id),
  can_edit_data boolean not null default true,
  can_delete_data boolean not null default true,
  can_lunas_data boolean not null default true,
  tanggal_setor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table if not exists public.pending_registrations (
  id uuid not null default gen_random_uuid() primary key,
  full_name text not null,
  username text not null unique,
  password_hash text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.deposit_date_settings (
  id uuid not null default gen_random_uuid() primary key,
  deposit_date text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifikasi_user (
  id uuid not null default gen_random_uuid() primary key,
  title text not null,
  message text not null,
  target_type text not null default 'all',
  target_user_id uuid,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.profit_settings (
  id uuid not null default gen_random_uuid() primary key,
  profit_amount numeric not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

create or replace function public.get_user_role(_user_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_roles
  where user_id = _user_id
  limit 1;
$$;

create or replace function public.get_global_sisa_saldo()
returns table (
  total_saldo_induk numeric,
  total_tagihan_aktif numeric,
  total_bayar numeric,
  sisa_saldo_global numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_saldo_induk numeric;
  v_total_tagihan_aktif numeric;
  v_total_bayar numeric;
begin
  select coalesce(sum(s.saldo_awal), 0)
  into v_total_saldo_induk
  from public.settings s
  inner join public.user_roles ur on s.user_id = ur.user_id
  where ur.role = 'admin';

  select coalesce(sum(jumlah), 0)
  into v_total_tagihan_aktif
  from public.tagihan
  where status = 'belum_lunas' and deleted_at is null;

  select coalesce(sum(jumlah), 0)
  into v_total_bayar
  from public.tagihan
  where status = 'lunas' and deleted_at is null;

  return query select
    v_total_saldo_induk,
    v_total_tagihan_aktif,
    v_total_bayar,
    v_total_saldo_induk - v_total_tagihan_aktif - v_total_bayar;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.settings (user_id, saldo_awal)
  values (new.id, 0)
  on conflict do nothing;
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'settings_updated_at'
  ) then
    create trigger settings_updated_at
    before update on public.settings
    for each row execute function public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'tagihan_updated_at'
  ) then
    create trigger tagihan_updated_at
    before update on public.tagihan
    for each row execute function public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'update_profiles_updated_at'
  ) then
    create trigger update_profiles_updated_at
    before update on public.profiles
    for each row execute function public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'update_pending_registrations_updated_at'
  ) then
    create trigger update_pending_registrations_updated_at
    before update on public.pending_registrations
    for each row execute function public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'update_deposit_date_settings_updated_at'
  ) then
    create trigger update_deposit_date_settings_updated_at
    before update on public.deposit_date_settings
    for each row execute function public.handle_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
  end if;
end $$;

alter table if exists public.settings enable row level security;
alter table if exists public.tagihan enable row level security;
alter table if exists public.profiles enable row level security;
alter table if exists public.user_roles enable row level security;
alter table if exists public.pending_registrations enable row level security;
alter table if exists public.deposit_date_settings enable row level security;
alter table if exists public.notifikasi_user enable row level security;
alter table if exists public.profit_settings enable row level security;
alter table if exists public.push_subscriptions enable row level security;

drop policy if exists "Users can view their own settings" on public.settings;
drop policy if exists "Users can create their own settings" on public.settings;
drop policy if exists "Users can update their own settings" on public.settings;
drop policy if exists "Users can delete their own settings" on public.settings;
create policy "Users can view their own settings" on public.settings for select using (auth.uid() = user_id);
create policy "Users can create their own settings" on public.settings for insert with check (auth.uid() = user_id);
create policy "Users can update their own settings" on public.settings for update using (auth.uid() = user_id);
create policy "Users can delete their own settings" on public.settings for delete using (auth.uid() = user_id);

drop policy if exists "Users can view their own active tagihan" on public.tagihan;
drop policy if exists "Users can view their own deleted tagihan" on public.tagihan;
drop policy if exists "Users can create their own tagihan" on public.tagihan;
drop policy if exists "Users can update their own active tagihan" on public.tagihan;
drop policy if exists "Users can restore their own deleted tagihan" on public.tagihan;
drop policy if exists "Admins can delete tagihan" on public.tagihan;
drop policy if exists "Admins can view all tagihan" on public.tagihan;
drop policy if exists "Admins can update any tagihan" on public.tagihan;
create policy "Users can view their own active tagihan" on public.tagihan for select using (auth.uid() = user_id and deleted_at is null);
create policy "Users can view their own deleted tagihan" on public.tagihan for select using (auth.uid() = user_id and deleted_at is not null);
create policy "Users can create their own tagihan" on public.tagihan for insert with check (auth.uid() = user_id);
create policy "Users can update their own active tagihan" on public.tagihan for update using (auth.uid() = user_id and deleted_at is null);
create policy "Users can restore their own deleted tagihan" on public.tagihan for update using (auth.uid() = user_id and deleted_at is not null);
create policy "Users can delete their own deleted tagihan" on public.tagihan for delete using (auth.uid() = user_id and deleted_at is not null);
create policy "Admins can delete tagihan" on public.tagihan for delete using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can view all tagihan" on public.tagihan for select using (public.has_role(auth.uid(), 'admin'));
create policy "Public can view active tagihan" on public.tagihan for select using (deleted_at is null);
create policy "Admins can update any tagihan" on public.tagihan for update using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;
drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Admins can view all profiles" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert profiles" on public.profiles for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update profiles" on public.profiles for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete profiles" on public.profiles for delete using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Users can view their own role" on public.user_roles;
drop policy if exists "Admins can view all roles" on public.user_roles;
drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Users can view their own role" on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert roles" on public.user_roles for insert with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update roles" on public.user_roles for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete roles" on public.user_roles for delete using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Anyone can register" on public.pending_registrations;
drop policy if exists "Admins can view pending registrations" on public.pending_registrations;
drop policy if exists "Admins can update pending registrations" on public.pending_registrations;
drop policy if exists "Admins can delete pending registrations" on public.pending_registrations;
create policy "Anyone can register" on public.pending_registrations for insert with check (true);
create policy "Admins can view pending registrations" on public.pending_registrations for select using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can update pending registrations" on public.pending_registrations for update using (public.has_role(auth.uid(), 'admin'));
create policy "Admins can delete pending registrations" on public.pending_registrations for delete using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage deposit date" on public.deposit_date_settings;
drop policy if exists "Authenticated users can view deposit date" on public.deposit_date_settings;
create policy "Admins can manage deposit date" on public.deposit_date_settings for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Authenticated users can view deposit date" on public.deposit_date_settings for select using (auth.uid() is not null);

drop policy if exists "Admins can manage notifications" on public.notifikasi_user;
drop policy if exists "Users can view their notifications" on public.notifikasi_user;
drop policy if exists "Users can mark notifications as read" on public.notifikasi_user;
create policy "Admins can manage notifications" on public.notifikasi_user for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Users can view their notifications" on public.notifikasi_user for select using (auth.uid() is not null and (target_type = 'all' or target_user_id = auth.uid()));
create policy "Users can mark notifications as read" on public.notifikasi_user for update using (auth.uid() is not null and (target_type = 'all' or target_user_id = auth.uid()));

drop policy if exists "Admins can manage profit_settings" on public.profit_settings;
drop policy if exists "All authenticated can read profit_settings" on public.profit_settings;
create policy "Admins can manage profit_settings" on public.profit_settings for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "All authenticated can read profit_settings" on public.profit_settings for select to authenticated using (true);

drop policy if exists "Users can manage push subscriptions" on public.push_subscriptions;
create policy "Users can manage push subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.deposit_date_settings (id, deposit_date)
values ('00000000-0000-0000-0000-000000000001', '1')
on conflict (id) do update set deposit_date = excluded.deposit_date, updated_at = now();

insert into public.profit_settings (id, profit_amount)
values ('00000000-0000-0000-0000-000000000001', 0)
on conflict (id) do update set profit_amount = excluded.profit_amount, updated_at = now();

insert into public.settings (user_id, saldo_awal)
select '0f1d8b32-dffe-428b-9adf-4711d5cce705', 0
where not exists (
  select 1
  from public.settings
  where user_id = '0f1d8b32-dffe-428b-9adf-4711d5cce705'
);

insert into public.profiles (user_id, full_name, username, created_by)
values (
  '0f1d8b32-dffe-428b-9adf-4711d5cce705',
  'Admin Rijal',
  'admin',
  '0f1d8b32-dffe-428b-9adf-4711d5cce705'
)
on conflict (user_id) do update
set full_name = excluded.full_name,
    username = excluded.username,
    created_by = excluded.created_by,
    updated_at = now();

insert into public.user_roles (user_id, role)
values ('0f1d8b32-dffe-428b-9adf-4711d5cce705', 'admin')
on conflict (user_id, role) do nothing;