alter table public.bids add column if not exists analytics_distinct_id text;
comment on column public.bids.analytics_distinct_id is 'Anonymous PostHog distinct ID for funnel correlation only; never used for authorization.';

drop function if exists public.process_paid_bid(text,text,text,uuid,jsonb);
create function public.process_paid_bid(p_webhook_id text, p_event_type text, p_payment_id text, p_bid_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_bid bids%rowtype; v_country countries%rowtype; v_leader country_stakes%rowtype;
  v_brand_total numeric; v_was_previous_owner boolean; v_outcome text := 'paid_but_not_leader';
begin
  insert into payment_webhooks(webhook_id,event_type,payment_id,payload) values(p_webhook_id,p_event_type,p_payment_id,p_payload) on conflict(webhook_id) do nothing;
  if not found then return jsonb_build_object('processed',false); end if;
  select * into v_bid from bids where id=p_bid_id for update;
  if v_bid.id is null or v_bid.status='paid' then return jsonb_build_object('processed',false); end if;
  select * into v_country from countries where id=v_bid.country_id for update;
  select exists(select 1 from ownership_history where country_id=v_bid.country_id and brand_id=v_bid.brand_id) into v_was_previous_owner;
  insert into country_stakes(country_id,brand_id,total_amount) values(v_bid.country_id,v_bid.brand_id,v_bid.amount_added)
  on conflict(country_id,brand_id) do update set total_amount=country_stakes.total_amount+excluded.total_amount,updated_at=now();
  select * into v_leader from country_stakes where country_id=v_bid.country_id order by total_amount desc,updated_at asc limit 1;
  select total_amount into v_brand_total from country_stakes where country_id=v_bid.country_id and brand_id=v_bid.brand_id;
  update bids set status='paid',dodo_payment_id=p_payment_id,paid_at=now(),previous_total=v_brand_total-v_bid.amount_added,new_total=v_brand_total where id=v_bid.id;
  if v_country.current_brand_id is distinct from v_leader.brand_id then
    update countries set current_brand_id=v_leader.brand_id,current_stake=v_leader.total_amount,claimed_at=now(),updated_at=now() where id=v_bid.country_id;
    insert into ownership_history(country_id,brand_id,previous_brand_id,winning_stake,bid_id) values(v_bid.country_id,v_leader.brand_id,v_country.current_brand_id,v_leader.total_amount,v_bid.id);
    if v_country.current_brand_id is null then v_outcome := 'country_claimed';
    elsif v_was_previous_owner and v_leader.brand_id=v_bid.brand_id then v_outcome := 'country_reclaimed';
    else v_outcome := 'country_taken_over'; end if;
  else
    update countries set current_stake=v_leader.total_amount,updated_at=now() where id=v_bid.country_id;
    if v_leader.brand_id=v_bid.brand_id then v_outcome := 'leader_extended'; end if;
  end if;
  return jsonb_build_object(
    'processed',true,'outcome',v_outcome,'country_code',v_country.iso3,'amount_added',v_bid.amount_added,
    'brand_total_stake',v_brand_total,'country_leading_stake',v_leader.total_amount,'previous_leading_stake',v_country.current_stake,
    'became_leader',(v_leader.brand_id=v_bid.brand_id),'analytics_distinct_id',v_bid.analytics_distinct_id
  );
end $$;
revoke all on function public.process_paid_bid(text,text,text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.process_paid_bid(text,text,text,uuid,jsonb) to service_role;
