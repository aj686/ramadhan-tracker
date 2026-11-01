-- Phase 2 trackers: Puasa Sunat, Quran, Doa Harian.
-- Moved here from Plans.md §8. Safe to re-run: tables and policies are only created when missing,
-- because it is not recorded whether the inline SQL already ran on the live project.

create table if not exists public.sunat_log (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children(id) on delete cascade,
  date       date not null,
  type       text not null check (type in ('isnin_khamis','syawal','arafah')),
  completed  boolean default false,
  unique (child_id, date, type)
);

create table if not exists public.quran_log (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children(id) on delete cascade,
  date       date not null,
  pages_read int default 0,
  unique (child_id, date)
);

create table if not exists public.doa_log (
  id               uuid primary key default gen_random_uuid(),
  child_id         uuid not null references public.children(id) on delete cascade,
  date             date not null,
  doa_makan        boolean default false,
  doa_tidur        boolean default false,
  doa_masuk_rumah  boolean default false,
  doa_keluar_rumah boolean default false,
  doa_tandas       boolean default false,
  doa_kenderaan    boolean default false,
  unique (child_id, date)
);

alter table public.sunat_log enable row level security;
alter table public.quran_log enable row level security;
alter table public.doa_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'sunat_log'
                   and policyname = 'Users manage own sunat logs') then
    create policy "Users manage own sunat logs" on public.sunat_log for all using (
      exists (select 1 from public.children
              where children.id = sunat_log.child_id and children.parent_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'quran_log'
                   and policyname = 'Users manage own quran logs') then
    create policy "Users manage own quran logs" on public.quran_log for all using (
      exists (select 1 from public.children
              where children.id = quran_log.child_id and children.parent_id = auth.uid())
    );
  end if;

  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'doa_log'
                   and policyname = 'Users manage own doa logs') then
    create policy "Users manage own doa logs" on public.doa_log for all using (
      exists (select 1 from public.children
              where children.id = doa_log.child_id and children.parent_id = auth.uid())
    );
  end if;
end $$;
