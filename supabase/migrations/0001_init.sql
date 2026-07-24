-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type provider_type as enum ('individual', 'company');
create type friendship_status as enum ('pending', 'accepted', 'declined', 'blocked');
create type quote_request_status as enum ('open', 'quoted', 'accepted', 'cancelled', 'expired');
create type quote_status as enum ('pending', 'accepted', 'rejected', 'withdrawn', 'expired');
create type job_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled', 'disputed');
create type payment_status as enum ('pending', 'authorized', 'captured', 'refunded', 'failed');
create type payout_status as enum ('pending', 'processing', 'paid', 'failed');

-- updated_at trigger helper
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 1. profiles: 1:1 extension of auth.users
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  avatar_url  text,
  suburb      text,
  city        text,
  province    text,
  latitude    numeric(9,6),
  longitude   numeric(9,6),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

-- auto-create a profile row when a new auth user signs up
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 2. friendships
create table friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  addressee_id  uuid not null references profiles(id) on delete cascade,
  status        friendship_status not null default 'pending',
  pair_key      uuid[] generated always as (
                  array[least(requester_id, addressee_id), greatest(requester_id, addressee_id)]
                ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (pair_key)
);
create trigger friendships_set_updated_at before update on friendships
  for each row execute function set_updated_at();
create index on friendships (requester_id, status);
create index on friendships (addressee_id, status);

-- 3. service_categories
create table service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  icon        text,
  is_active   boolean not null default true,
  sort_order  int not null default 0
);

-- 4. providers
create table providers (
  id                 uuid primary key default gen_random_uuid(),
  owner_profile_id   uuid not null references profiles(id) on delete cascade,
  provider_type      provider_type not null,
  display_name       text not null,
  description        text,
  logo_url           text,
  phone              text,
  suburb             text,
  city               text,
  province           text,
  latitude           numeric(9,6),
  longitude          numeric(9,6),
  service_radius_km  numeric(5,1),
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger providers_set_updated_at before update on providers
  for each row execute function set_updated_at();
create index on providers (owner_profile_id);
create index on providers (city, province) where is_active;

-- 5. provider_categories
create table provider_categories (
  provider_id  uuid not null references providers(id) on delete cascade,
  category_id  uuid not null references service_categories(id) on delete restrict,
  primary key (provider_id, category_id)
);
create index on provider_categories (category_id);

-- 6. quote_requests
create table quote_requests (
  id                    uuid primary key default gen_random_uuid(),
  customer_profile_id   uuid not null references profiles(id) on delete cascade,
  category_id           uuid not null references service_categories(id) on delete restrict,
  description           text not null,
  address_line          text,
  suburb                text,
  city                  text,
  province              text,
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  status                quote_request_status not null default 'open',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger quote_requests_set_updated_at before update on quote_requests
  for each row execute function set_updated_at();
create index on quote_requests (customer_profile_id);

-- 7. quote_request_providers
create table quote_request_providers (
  quote_request_id  uuid not null references quote_requests(id) on delete cascade,
  provider_id        uuid not null references providers(id) on delete cascade,
  invited_at         timestamptz not null default now(),
  viewed_at          timestamptz,
  declined_at        timestamptz,
  primary key (quote_request_id, provider_id)
);
create index on quote_request_providers (provider_id);

-- 8. quotes
create table quotes (
  id                 uuid primary key default gen_random_uuid(),
  quote_request_id   uuid not null references quote_requests(id) on delete cascade,
  provider_id        uuid not null references providers(id) on delete cascade,
  price_cents        bigint not null check (price_cents >= 0),
  message            text,
  status             quote_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (quote_request_id, provider_id),
  foreign key (quote_request_id, provider_id)
    references quote_request_providers (quote_request_id, provider_id)
    on delete cascade
);
create trigger quotes_set_updated_at before update on quotes
  for each row execute function set_updated_at();
create index on quotes (provider_id, status);

-- 9. jobs
create table jobs (
  id                    uuid primary key default gen_random_uuid(),
  quote_request_id      uuid not null unique references quote_requests(id) on delete restrict,
  quote_id              uuid not null unique references quotes(id) on delete restrict,
  customer_profile_id   uuid not null references profiles(id) on delete restrict,
  provider_id           uuid not null references providers(id) on delete restrict,
  price_cents           bigint not null check (price_cents >= 0),
  status                job_status not null default 'scheduled',
  scheduled_at          timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger jobs_set_updated_at before update on jobs
  for each row execute function set_updated_at();
create index on jobs (provider_id, status);
create index on jobs (customer_profile_id);

-- 10. payments
create table payments (
  id                    uuid primary key default gen_random_uuid(),
  job_id                uuid not null unique references jobs(id) on delete restrict,
  customer_profile_id   uuid not null references profiles(id) on delete restrict,
  amount_cents          bigint not null check (amount_cents >= 0),
  currency              text not null default 'ZAR',
  status                payment_status not null default 'pending',
  provider_reference    text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger payments_set_updated_at before update on payments
  for each row execute function set_updated_at();
create index on payments (customer_profile_id);

-- 11. payouts
create table payouts (
  id                    uuid primary key default gen_random_uuid(),
  job_id                uuid not null unique references jobs(id) on delete restrict,
  payment_id            uuid not null references payments(id) on delete restrict,
  provider_id           uuid not null references providers(id) on delete restrict,
  gross_amount_cents    bigint not null check (gross_amount_cents >= 0),
  platform_fee_cents    bigint not null check (platform_fee_cents >= 0),
  net_amount_cents      bigint generated always as (gross_amount_cents - platform_fee_cents) stored,
  status                payout_status not null default 'pending',
  payout_reference      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create trigger payouts_set_updated_at before update on payouts
  for each row execute function set_updated_at();
create index on payouts (provider_id);

-- providers: paystack recipient (added here rather than a separate table for v1 simplicity)
alter table providers add column paystack_recipient_code text;

-- ============================================================
-- RPCs
-- ============================================================

-- accept_quote: atomically accept one quote, reject siblings, create the job
create or replace function accept_quote(p_quote_id uuid)
returns jobs
language plpgsql
security definer set search_path = public
as $$
declare
  v_quote quotes%rowtype;
  v_request quote_requests%rowtype;
  v_job jobs%rowtype;
begin
  select * into v_quote from quotes where id = p_quote_id;
  if not found then
    raise exception 'Quote not found';
  end if;

  select * into v_request from quote_requests where id = v_quote.quote_request_id for update;

  if v_request.customer_profile_id <> auth.uid() then
    raise exception 'Not authorized to accept this quote';
  end if;

  if v_request.status <> 'open' then
    raise exception 'Quote request is no longer open';
  end if;

  update quotes set status = 'accepted' where id = p_quote_id;
  update quotes set status = 'rejected' where quote_request_id = v_request.id and id <> p_quote_id and status = 'pending';
  update quote_requests set status = 'accepted' where id = v_request.id;

  insert into jobs (quote_request_id, quote_id, customer_profile_id, provider_id, price_cents)
  values (v_request.id, v_quote.id, v_request.customer_profile_id, v_quote.provider_id, v_quote.price_cents)
  returning * into v_job;

  return v_job;
end;
$$;

grant execute on function accept_quote(uuid) to authenticated;

-- friend_provider_history: minimal fields only, checks friendship internally
create or replace function friend_provider_history(target_provider_id uuid)
returns table (friend_id uuid, friend_name text, friend_avatar_url text, completed_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.avatar_url, j.completed_at
  from jobs j
  join profiles p on p.id = j.customer_profile_id
  where j.provider_id = target_provider_id
    and j.status = 'completed'
    and exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and least(f.requester_id, f.addressee_id) = least(auth.uid(), j.customer_profile_id)
        and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), j.customer_profile_id)
    );
$$;

grant execute on function friend_provider_history(uuid) to authenticated;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table friendships enable row level security;
alter table service_categories enable row level security;
alter table providers enable row level security;
alter table provider_categories enable row level security;
alter table quote_requests enable row level security;
alter table quote_request_providers enable row level security;
alter table quotes enable row level security;
alter table jobs enable row level security;
alter table payments enable row level security;
alter table payouts enable row level security;

-- profiles
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from friendships f
      where f.status = 'accepted'
        and least(f.requester_id, f.addressee_id) = least(auth.uid(), profiles.id)
        and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), profiles.id)
    )
    or exists (
      select 1 from quote_requests qr
      join quote_request_providers qrp on qrp.quote_request_id = qr.id
      join providers pr on pr.id = qrp.provider_id
      where qr.customer_profile_id = profiles.id and pr.owner_profile_id = auth.uid()
    )
  );
create policy "profiles_update_own" on profiles for update using (id = auth.uid());

-- friendships
create policy "friendships_select" on friendships for select
  using (auth.uid() in (requester_id, addressee_id));
create policy "friendships_insert" on friendships for insert
  with check (auth.uid() = requester_id and requester_id <> addressee_id);
create policy "friendships_update" on friendships for update
  using (auth.uid() = addressee_id or (auth.uid() = requester_id and status = 'pending'));
create policy "friendships_delete" on friendships for delete
  using (auth.uid() in (requester_id, addressee_id));

-- service_categories
create policy "service_categories_select_public" on service_categories for select using (true);

-- providers
create policy "providers_select" on providers for select
  using (is_active or owner_profile_id = auth.uid());
create policy "providers_insert_own" on providers for insert
  with check (owner_profile_id = auth.uid());
create policy "providers_update_own" on providers for update
  using (owner_profile_id = auth.uid());
create policy "providers_delete_own" on providers for delete
  using (owner_profile_id = auth.uid());

-- provider_categories
create policy "provider_categories_select_public" on provider_categories for select using (true);
create policy "provider_categories_write_own" on provider_categories for all
  using (exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid()))
  with check (exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid()));

-- quote_requests
create policy "quote_requests_select" on quote_requests for select
  using (
    customer_profile_id = auth.uid()
    or exists (
      select 1 from quote_request_providers qrp
      join providers p on p.id = qrp.provider_id
      where qrp.quote_request_id = quote_requests.id and p.owner_profile_id = auth.uid()
    )
  );
create policy "quote_requests_insert_own" on quote_requests for insert
  with check (customer_profile_id = auth.uid());
create policy "quote_requests_update_own" on quote_requests for update
  using (customer_profile_id = auth.uid());

-- quote_request_providers
create policy "qrp_select" on quote_request_providers for select
  using (
    exists (select 1 from quote_requests qr where qr.id = quote_request_id and qr.customer_profile_id = auth.uid())
    or exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
  );
create policy "qrp_insert_by_customer" on quote_request_providers for insert
  with check (
    exists (
      select 1 from quote_requests qr
      where qr.id = quote_request_id and qr.customer_profile_id = auth.uid() and qr.status = 'open'
    )
  );
create policy "qrp_update" on quote_request_providers for update
  using (
    exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
    or exists (select 1 from quote_requests qr where qr.id = quote_request_id and qr.customer_profile_id = auth.uid())
  );
create policy "qrp_delete_by_customer" on quote_request_providers for delete
  using (
    exists (select 1 from quote_requests qr where qr.id = quote_request_id and qr.customer_profile_id = auth.uid())
  );

-- quotes
create policy "quotes_select" on quotes for select
  using (
    exists (select 1 from quote_requests qr where qr.id = quote_request_id and qr.customer_profile_id = auth.uid())
    or exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
  );
create policy "quotes_insert_by_provider" on quotes for insert
  with check (
    exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
    and exists (select 1 from quote_requests qr where qr.id = quote_request_id and qr.status = 'open')
  );
create policy "quotes_update_by_provider" on quotes for update
  using (
    exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
    and status = 'pending'
  );

-- jobs (no insert/delete policy for authenticated -- created only via accept_quote SECURITY DEFINER RPC)
create policy "jobs_select" on jobs for select
  using (
    customer_profile_id = auth.uid()
    or exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
  );
create policy "jobs_update" on jobs for update
  using (
    customer_profile_id = auth.uid()
    or exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
  );

-- payments (status transitions written only by service role via webhook; no update policy for authenticated)
create policy "payments_select" on payments for select
  using (
    customer_profile_id = auth.uid()
    or exists (select 1 from jobs j join providers p on p.id = j.provider_id where j.id = job_id and p.owner_profile_id = auth.uid())
  );
create policy "payments_insert_own" on payments for insert
  with check (customer_profile_id = auth.uid());

-- payouts (service role only; no policies granted to authenticated beyond select)
create policy "payouts_select" on payouts for select
  using (
    exists (select 1 from jobs j where j.id = job_id and j.customer_profile_id = auth.uid())
    or exists (select 1 from providers p where p.id = provider_id and p.owner_profile_id = auth.uid())
  );

-- seed service categories
insert into service_categories (slug, name, sort_order) values
  ('plumbing', 'Plumbing', 1),
  ('electrical', 'Electrical', 2),
  ('cleaning', 'Cleaning', 3),
  ('gardening', 'Gardening', 4),
  ('security', 'Security', 5);
