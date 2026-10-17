begin;
do $$
declare
  v_suffix text := replace(gen_random_uuid()::text, '-', '');
  v_buyer text;
  v_seller text;
  v_first text;
  v_second text;
  v_spare text;
  v_result jsonb;
  v_blocked boolean;
  v_items jsonb;
  v_network text;
begin
  v_buyer := 'commerce_check_buyer_' || v_suffix || '@example.invalid';
  v_seller := 'commerce_check_seller_' || v_suffix || '@example.invalid';
  insert into public.profiles(email) values(v_buyer), (v_seller);
  insert into public.top_ups(user_email, amount, coin, network, status)
    values(v_buyer, 20, 'USDT', 'commerce_check', 'approved');
  insert into public.tg_accounts(country_iso, phone_number, price, owner_email, password)
    values('ZZ', 'commerce_check_1_' || v_suffix, 4.50, v_seller, 'test') returning id into v_first;
  insert into public.tg_accounts(country_iso, phone_number, price, owner_email, password)
    values('ZZ', 'commerce_check_2_' || v_suffix, 2.25, v_seller, 'test') returning id into v_second;
  insert into public.tg_accounts(country_iso, phone_number, price, owner_email)
    values('ZZ', 'commerce_check_3_' || v_suffix, 2.25, v_seller) returning id into v_spare;
  v_items := jsonb_build_array(jsonb_build_object('id', v_first, 'price', 4.50), jsonb_build_object('id', v_second, 'price', 2.25));
  v_result := public.complete_account_purchase(v_buyer, v_items, 'season', 'commerce_check_' || v_suffix);
  if public.commerce_balance(v_buyer) <> 13.25 or public.commerce_balance(v_seller) <> 6.75 then
    raise exception 'Purchase balance assertion failed';
  end if;
  if (select count(*) from public.tg_accounts where id in (v_first, v_second) and status = 'sold' and owner_email = v_buyer and password = '') <> 2 then
    raise exception 'Ownership assertion failed';
  end if;
  if (select count(*) from public.top_ups where user_email = v_seller and network = 'account_sale' and status = 'approved') <> 2 then
    raise exception 'Seller credit assertion failed';
  end if;
  v_blocked := false;
  begin
    perform public.complete_account_purchase(v_buyer, v_items, 'season', null);
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked or public.commerce_balance(v_seller) <> 6.75 then raise exception 'Duplicate purchase assertion failed'; end if;
  v_blocked := false;
  begin
    perform public.complete_account_purchase(v_buyer, jsonb_build_array(jsonb_build_object('id', v_spare, 'price', 2.25), jsonb_build_object('id', v_first, 'price', 4.50)), 'season', null);
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked or (select status from public.tg_accounts where id = v_spare) <> 'available' then
    raise exception 'Atomic purchase assertion failed';
  end if;
  v_blocked := false;
  begin
    perform public.complete_account_purchase(v_buyer, jsonb_build_array(jsonb_build_object('id', v_spare, 'price', 1)), 'single', null);
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'Changed price assertion failed'; end if;
  foreach v_network in array array['BEP20', 'POLYGON', 'TON'] loop
    v_result := public.create_wallet_withdrawal(v_buyer, 3,
      case when v_network = 'TON' then '0:' || repeat('0', 64) else '0x' || repeat('0', 40) end, v_network);
    if v_result->'withdrawal'->>'network' <> v_network or (v_result->'withdrawal'->>'amount')::numeric <> 3 then
      raise exception 'Withdrawal network assertion failed';
    end if;
    if v_result->'withdrawal'->>'coin' <> (case when v_network = 'TON' then 'TON' else 'USDT' end) then
      raise exception 'Withdrawal asset assertion failed';
    end if;
  end loop;
  if public.commerce_balance(v_buyer) <> 4.25 then raise exception 'Withdrawal hold assertion failed'; end if;
  v_blocked := false;
  begin
    perform public.create_wallet_withdrawal(v_buyer, 5, '0x' || repeat('0', 40), 'BEP20');
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'Insufficient funds assertion failed'; end if;
  v_blocked := false;
  begin
    perform public.create_wallet_withdrawal(v_buyer, 2, '0x' || repeat('0', 40), 'BEP20');
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'Minimum withdrawal assertion failed'; end if;
  v_blocked := false;
  begin
    perform public.create_wallet_withdrawal(v_buyer, 3, '0x' || repeat('0', 40), 'TON');
  exception when others then
    v_blocked := true;
  end;
  if not v_blocked then raise exception 'Address network assertion failed'; end if;
  update public.withdrawals set status = 'rejected' where user_email = v_buyer and network = 'POLYGON';
  if public.commerce_balance(v_buyer) <> 7.25 then raise exception 'Rejected withdrawal refund assertion failed'; end if;
  update public.withdrawals set status = 'approved' where user_email = v_buyer and network = 'BEP20';
  if public.commerce_balance(v_buyer) <> 7.25 then raise exception 'Approved withdrawal double-debit assertion failed'; end if;
  if has_function_privilege('anon', 'public.complete_account_purchase(text,jsonb,text,text)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.create_wallet_withdrawal(text,numeric,text,text)', 'EXECUTE') then
    raise exception 'Privileged operation assertion failed';
  end if;
end;
$$;
select 'passed' as accounting_checks, 'all temporary records rolled back' as cleanup;
rollback;