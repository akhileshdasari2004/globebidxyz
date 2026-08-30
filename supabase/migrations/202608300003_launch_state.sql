-- Public launch reset. A pre-migration JSON export is kept outside Git in .backups/.
alter table public.bids add column if not exists is_founder_seed boolean not null default false;
comment on column public.bids.is_founder_seed is
  'True only for non-payment founder placements; excluded from payment and revenue analytics.';

-- The tagline was never part of the launch product. Keep the historical migrations immutable and
-- remove the field in a forward migration so fresh and existing databases converge safely.
alter table public.brands drop column if exists tagline;

do $$
declare
  v_india_id uuid;
  v_brand_id uuid := gen_random_uuid();
  v_bid_id uuid := gen_random_uuid();
  v_now timestamptz := now();
begin
  select id into strict v_india_id from public.countries where iso3 = 'IND' for update;

  -- Release foreign-key references before clearing transactional and test brand data.
  update public.countries
    set current_brand_id = null, current_stake = 0, claimed_at = null, updated_at = v_now;
  delete from public.ownership_history;
  delete from public.country_stakes;
  delete from public.bids;
  delete from public.payment_webhooks;
  delete from public.brands;

  insert into public.brands (id, name, website_url, logo_url, status, created_at, updated_at)
  values (
    v_brand_id,
    'its me',
    'https://akhileshdasariportfolio24.vercel.app/',
    'https://gzzkotgrvhvwqkigvshi.supabase.co/storage/v1/object/public/logos/pending/fdcdc20e-d612-494b-95b8-b13b3de54a12.png',
    'active',
    v_now,
    v_now
  );

  -- This mirrors a completed real bid's relational state, but deliberately has no Dodo IDs,
  -- webhook, or analytics distinct ID because no money changed hands.
  insert into public.bids (
    id, country_id, brand_id, amount_added, previous_total, new_total, currency, status,
    dodo_payment_id, dodo_checkout_id, created_at, paid_at, analytics_distinct_id, is_founder_seed
  ) values (
    v_bid_id, v_india_id, v_brand_id, 5, 0, 5, 'USD', 'paid',
    null, null, v_now, v_now, null, true
  );

  insert into public.country_stakes (country_id, brand_id, total_amount, created_at, updated_at)
  values (v_india_id, v_brand_id, 5, v_now, v_now);

  insert into public.ownership_history (
    country_id, brand_id, previous_brand_id, winning_stake, bid_id, started_at, created_at
  ) values (v_india_id, v_brand_id, null, 5, v_bid_id, v_now, v_now);

  update public.countries
    set current_brand_id = v_brand_id, current_stake = 5, claimed_at = v_now, updated_at = v_now
    where id = v_india_id;
end $$;
