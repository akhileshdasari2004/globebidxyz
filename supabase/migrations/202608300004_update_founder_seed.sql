-- Update the non-revenue founder placement identity without creating a payment or webhook.
update public.brands as brand
set
  name = 'akhileshYcreate',
  website_url = 'https://x.com/akhileshYcreate',
  updated_at = now()
where exists (
  select 1
  from public.bids as bid
  join public.countries as country on country.id = bid.country_id
  where bid.brand_id = brand.id
    and bid.is_founder_seed = true
    and country.iso3 = 'IND'
);
