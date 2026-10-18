begin;

create or replace function public.commerce_balance(p_email text)
returns numeric language sql stable security definer set search_path = '' as $$
  select round(
    coalesce((select sum(amount) from public.top_ups where user_email = p_email and status = 'approved'), 0)
    - coalesce((select sum(price) from public.product_orders where user_email = p_email and status = 'completed'), 0)
    - coalesce((select sum(price) from public.tg_accounts where owner_email = p_email and status = 'sold'), 0)
    - coalesce((select sum(amount) from public.withdrawals where user_email = p_email and status in ('pending', 'approved')), 0), 2);
$$;
revoke all on function public.commerce_balance(text) from public, anon, authenticated;
grant execute on function public.commerce_balance(text) to service_role;

create or replace function public.complete_account_purchase(
  p_buyer_email text, p_items jsonb, p_purchase_type text, p_batch_id text default null
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_item jsonb;
  v_account public.tg_accounts%rowtype;
  v_ids text[];
  v_affected text[] := array[p_buyer_email];
  v_price numeric;
  v_total numeric := 0;
  v_commission numeric := 0;
begin
  if nullif(trim(p_buyer_email), '') is null or jsonb_typeof(p_items) is distinct from 'array'
    or jsonb_array_length(p_items) not between 1 and 40
    or p_purchase_type not in ('single', 'season') or p_purchase_type is null then
    raise exception 'Invalid purchase';
  end if;
  select array_agg(item->>'id') into v_ids from jsonb_array_elements(p_items) item;
  if (select count(distinct id) from unnest(v_ids) id) <> cardinality(v_ids) then
    raise exception 'Duplicate or missing account';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_buyer_email, 0));
  perform 1 from public.tg_accounts where id = any(v_ids) order by id for update;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_account from public.tg_accounts where id = v_item->>'id';
    if not found or v_account.status <> 'available' then
      raise exception 'Account already sold or unavailable';
    end if;
    if v_account.owner_email = p_buyer_email then
      raise exception 'You cannot buy your own account';
    end if;
    v_price := (v_item->>'price')::numeric;
    if v_price is null or v_price < 0 or v_price::text in ('NaN', 'Infinity', '-Infinity')
      or v_price <> round(v_price, 2) then
      raise exception 'Invalid account price';
    end if;
    if v_account.price > 0 and v_account.price <> v_price then
      raise exception 'Account price changed; refresh the market';
    end if;
    v_total := v_total + v_price;
  end loop;
  -- Platform commission: $0.05 per $1 (5%) charged to the BUYER on top of the
  -- sale price; the seller still receives the full price.
  v_commission := round(v_total * 0.05, 2);
  if public.commerce_balance(p_buyer_email) < v_total + v_commission then
    raise exception 'Insufficient balance (5%% service fee applies on top of the price)';
  end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    select * into v_account from public.tg_accounts where id = v_item->>'id';
    v_price := (v_item->>'price')::numeric;
    update public.tg_accounts set status = 'sold', owner_email = p_buyer_email,
      purchase_type = p_purchase_type, batch_id = p_batch_id, password = '', price = v_price
      where id = v_account.id;
    if nullif(trim(v_account.owner_email), '') is not null and v_price > 0 then
      insert into public.top_ups(user_email, amount, coin, network, tx_hash, status)
        values(v_account.owner_email, v_price, 'USDT', 'account_sale', 'sale:' || v_account.id, 'approved');
      v_affected := array_append(v_affected, v_account.owner_email);
    end if;
  end loop;
  -- Commission is kept as its own ledger row (negative top-up) so it is
  -- recorded separately from the sale and the balance math stays auditable.
  if v_commission > 0 then
    insert into public.top_ups(user_email, amount, coin, network, tx_hash, status)
      values(p_buyer_email, -v_commission, 'USDT', 'purchase_commission',
        'commission:' || coalesce(p_batch_id, v_ids[1]), 'approved');
  end if;
  update public.profiles p set balance = public.commerce_balance(p.email) where p.email = any(v_affected);
  return jsonb_build_object('account_ids', to_jsonb(v_ids), 'total', v_total,
    'commission', v_commission,
    'new_balance', public.commerce_balance(p_buyer_email));
end;
$$;
revoke all on function public.complete_account_purchase(text, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.complete_account_purchase(text, jsonb, text, text) to service_role;

create or replace function public.create_wallet_withdrawal(
  p_email text, p_amount numeric, p_wallet_address text, p_network text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_withdrawal public.withdrawals%rowtype;
  v_balance numeric;
begin
  if nullif(trim(p_email), '') is null or p_amount is null or p_amount < 3
    or p_amount::text in ('NaN', 'Infinity', '-Infinity') or p_amount <> round(p_amount, 2) then
    raise exception 'Minimum withdrawal is $3; use at most two decimal places';
  end if;
  if p_network is null or p_network not in ('BEP20', 'POLYGON', 'TON') then
    raise exception 'Invalid withdrawal network';
  end if;
  if p_wallet_address is null or
    (p_network in ('BEP20', 'POLYGON') and p_wallet_address !~ '^0x[0-9a-fA-F]{40}$') or
    (p_network = 'TON' and p_wallet_address !~ '^(EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$'
      and p_wallet_address !~ '^(0|-1):[0-9a-fA-F]{64}$') then
    raise exception 'Invalid wallet address for the selected network';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_email, 0));
  v_balance := public.commerce_balance(p_email);
  if v_balance < p_amount then
    raise exception 'Insufficient balance';
  end if;
  insert into public.withdrawals(user_email, amount, wallet_address, coin, network, status)
    values(p_email, p_amount, p_wallet_address, case when p_network = 'TON' then 'TON' else 'USDT' end, p_network, 'pending')
    returning * into v_withdrawal;
  v_balance := public.commerce_balance(p_email);
  update public.profiles set balance = v_balance where email = p_email;
  return jsonb_build_object('withdrawal', to_jsonb(v_withdrawal), 'balance', v_balance);
end;
$$;
revoke all on function public.create_wallet_withdrawal(text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.create_wallet_withdrawal(text, numeric, text, text) to service_role;

commit;