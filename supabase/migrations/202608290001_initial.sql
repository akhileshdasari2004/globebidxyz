create extension if not exists pgcrypto;

create table public.brands (
  id uuid primary key default gen_random_uuid(), name text not null check (char_length(name) between 1 and 60), website_url text not null,
  tagline text check (tagline is null or char_length(tagline) <= 80), logo_url text not null, email text, status text not null default 'active' check (status in ('active','pending_review','blocked')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index brands_website_idx on public.brands (website_url);

create table public.countries (
  id uuid primary key default gen_random_uuid(), iso2 text not null unique check (char_length(iso2)=2), iso3 text not null unique check (char_length(iso3)=3), name text not null,
  centroid_lat numeric not null, centroid_lng numeric not null, current_brand_id uuid references public.brands(id) on delete set null,
  current_stake numeric(12,2) not null default 0 check (current_stake >= 0), claimed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index countries_current_brand_idx on public.countries (current_brand_id);

create table public.country_stakes (
  id uuid primary key default gen_random_uuid(), country_id uuid not null references public.countries(id) on delete cascade, brand_id uuid not null references public.brands(id) on delete cascade,
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(country_id, brand_id)
);
create index country_stakes_leader_idx on public.country_stakes (country_id, total_amount desc);

create table public.bids (
  id uuid primary key default gen_random_uuid(), country_id uuid not null references public.countries(id), brand_id uuid not null references public.brands(id),
  amount_added numeric(12,2) not null check (amount_added > 0), previous_total numeric(12,2) not null default 0, new_total numeric(12,2) not null,
  currency text not null default 'USD', status text not null default 'pending' check (status in ('pending','processing','paid','failed','cancelled','refunded','disputed')),
  dodo_payment_id text, dodo_checkout_id text, created_at timestamptz not null default now(), paid_at timestamptz
);
create index bids_country_created_idx on public.bids (country_id, created_at desc); create index bids_payment_idx on public.bids (dodo_payment_id);

create table public.ownership_history (
  id uuid primary key default gen_random_uuid(), country_id uuid not null references public.countries(id), brand_id uuid not null references public.brands(id), previous_brand_id uuid references public.brands(id),
  winning_stake numeric(12,2) not null, bid_id uuid not null references public.bids(id), started_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index ownership_country_idx on public.ownership_history (country_id, started_at desc);

create table public.payment_webhooks (
  id uuid primary key default gen_random_uuid(), webhook_id text not null unique, event_type text not null, payment_id text, payload jsonb not null,
  processed_at timestamptz not null default now(), created_at timestamptz not null default now()
);

create or replace function public.process_paid_bid(p_webhook_id text, p_event_type text, p_payment_id text, p_bid_id uuid, p_payload jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_bid bids%rowtype; v_previous_brand uuid; v_leader country_stakes%rowtype;
begin
  insert into payment_webhooks(webhook_id,event_type,payment_id,payload) values(p_webhook_id,p_event_type,p_payment_id,p_payload) on conflict(webhook_id) do nothing;
  if not found then return; end if;
  select * into v_bid from bids where id=p_bid_id for update;
  if v_bid.id is null or v_bid.status='paid' then return; end if;
  perform 1 from countries where id=v_bid.country_id for update;
  insert into country_stakes(country_id,brand_id,total_amount) values(v_bid.country_id,v_bid.brand_id,v_bid.amount_added)
  on conflict(country_id,brand_id) do update set total_amount=country_stakes.total_amount+excluded.total_amount, updated_at=now();
  select * into v_leader from country_stakes where country_id=v_bid.country_id order by total_amount desc, updated_at asc limit 1;
  select current_brand_id into v_previous_brand from countries where id=v_bid.country_id;
  update bids set status='paid', dodo_payment_id=p_payment_id, paid_at=now(), previous_total=(select total_amount-v_bid.amount_added from country_stakes where country_id=v_bid.country_id and brand_id=v_bid.brand_id), new_total=(select total_amount from country_stakes where country_id=v_bid.country_id and brand_id=v_bid.brand_id) where id=v_bid.id;
  if v_previous_brand is distinct from v_leader.brand_id then
    update countries set current_brand_id=v_leader.brand_id,current_stake=v_leader.total_amount,claimed_at=now(),updated_at=now() where id=v_bid.country_id;
    insert into ownership_history(country_id,brand_id,previous_brand_id,winning_stake,bid_id) values(v_bid.country_id,v_leader.brand_id,v_previous_brand,v_leader.total_amount,v_bid.id);
  else update countries set current_stake=v_leader.total_amount,updated_at=now() where id=v_bid.country_id; end if;
end $$;
revoke all on function public.process_paid_bid(text,text,text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.process_paid_bid(text,text,text,uuid,jsonb) to service_role;

alter table brands enable row level security; alter table countries enable row level security; alter table country_stakes enable row level security; alter table bids enable row level security; alter table ownership_history enable row level security; alter table payment_webhooks enable row level security;
create policy "public active brands" on brands for select using (status='active');
create policy "public countries" on countries for select using (true);
create policy "public stakes" on country_stakes for select using (true);
create policy "public ownership history" on ownership_history for select using (true);
alter publication supabase_realtime add table countries;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('logos','logos',true,2097152,array['image/png','image/jpeg','image/webp']) on conflict(id) do update set public=true,file_size_limit=2097152,allowed_mime_types=excluded.allowed_mime_types;
create policy "public logo reads" on storage.objects for select using (bucket_id='logos');
