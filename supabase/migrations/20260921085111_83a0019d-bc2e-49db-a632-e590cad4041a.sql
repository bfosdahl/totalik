insert into public.nextcom_product_prices (normalized_name, product_name, unit_price, is_bht, last_seen_at)
values ('bedriftshelsetjeneste 12mnd inkl. kartlegging (21-30 ansatte)', 'Bedriftshelsetjeneste 12mnd inkl. kartlegging  (21-30 Ansatte)', 13990, true, now())
on conflict (normalized_name) do update set unit_price = excluded.unit_price, is_bht = true, last_seen_at = now();