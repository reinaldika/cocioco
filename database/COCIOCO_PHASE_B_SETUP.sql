-- COCIOCO SHOP Phase B: execute ONLY in a fresh, dedicated COCIOCO Supabase project.
-- Review with your database administrator before running. Non-destructive to existing projects.
-- PostgreSQL 15+/Supabase. Do NOT run this in Garwa Creative Management.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null default 'Creative human',
 email text not null,
 role text not null default 'customer' check (role in ('customer','designer','admin')),
 designer_requested boolean not null default false,
 designer_approved boolean not null default false,
 show_earnings_on_leaderboard boolean not null default false,
 created_at timestamptz not null default now()
);

create or replace function private.new_user_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles (id,name,email,designer_requested)
 values(new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'name'),''),'Creative human'),80),
        coalesce(new.email,''), coalesce(new.raw_user_meta_data->>'wants_designer','false')='true')
 on conflict(id) do nothing;
 return new;
end;
$$;
drop trigger if exists cocioco_new_user on auth.users;
create trigger cocioco_new_user after insert on auth.users
for each row execute function private.new_user_profile();

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists (select 1 from public.profiles where id=(select auth.uid()) and role='admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create table if not exists public.products (
 id text primary key, slug text not null unique, name text not null,
 category text not null check(category in ('physical','digital')),
 collection text not null default '', price integer not null check(price>=0),
 image text not null default '/assets/binder.svg', badge text, color text not null default '#f9d3ee',
 description text not null default '', includes text[] not null default '{}',
 stock integer not null default 0 check(stock>=0), published boolean not null default true,
 digital_asset_path text, updated_at timestamptz not null default now()
);

create table if not exists public.custom_prices (
 id text primary key check(id in ('collection-book','card-holder','keychain','photocard-set')),
 base integer not null check(base>=1000), design_fee integer not null check(design_fee>=0)
);

create table if not exists public.shop_settings (
 id integer primary key default 1 check(id=1), bank_name text not null default '',
 account_number text not null default '', account_holder text not null default '',
 paypal_email text not null default '', whatsapp_number text not null default '6282317422632',
 updated_at timestamptz not null default now()
);
insert into public.shop_settings(id) values(1) on conflict do nothing;

create table if not exists public.orders (
 id text primary key,
 customer_id uuid not null references public.profiles(id) on delete restrict,
 checkout_token uuid not null,
 customer_name text not null, email text not null, phone text not null, address text not null default '',
 country text not null, currency text not null check(currency in ('IDR','USD')),
 fx_rate numeric(16,4) not null default 1, fx_source text not null,
 fx_as_of text not null default '', total_idr integer not null check(total_idr>=0),
 amount_due numeric(16,2) not null check(amount_due>=0),
 items jsonb not null default '[]'::jsonb, lines jsonb not null default '[]'::jsonb,
 payment_method text not null check(payment_method in ('bank_transfer','paypal_manual')),
 stock_reserved boolean not null default true,
 payment_status text not null default 'awaiting_payment' check(payment_status in ('awaiting_payment','pending_verification','verified','rejected')),
 fulfillment_status text not null default 'awaiting_payment' check(fulfillment_status in ('awaiting_payment','confirmed','design_review','preparing','packing','handed_to_courier','in_transit','delivered','cancelled')),
 courier text not null default '', tracking_number text not null default '',
 leaderboard_opt_in boolean not null default false, collector_alias text,
 linked_task_id text,
 created_at timestamptz not null default now(),
 unique(customer_id,checkout_token)
);
create index if not exists orders_customer_idx on public.orders(customer_id,created_at desc);
create index if not exists orders_payment_idx on public.orders(payment_status,created_at desc);

create table if not exists public.order_events (
 id uuid primary key default gen_random_uuid(), order_id text not null references public.orders(id) on delete cascade,
 status text not null, note text not null, actor_id uuid references public.profiles(id),
 created_at timestamptz not null default now()
);
create index if not exists order_events_lookup_idx on public.order_events(order_id,created_at);

create table if not exists public.tasks (
 id text primary key, title text not null, category text not null default 'Design',
 description text not null default '', reward integer not null check(reward>=1000),
 duration_hours integer not null default 8 check(duration_hours between 1 and 48),
 status text not null default 'available' check(status in ('available','in_progress','under_review','revision','completed','cancelled')),
 art text not null default '/assets/elements.svg',tone text not null default 'pink',
 skills text[] not null default '{}', deliverables text[] not null default '{}',
 assigned_to uuid references public.profiles(id), assigned_name text,
 claimed_at timestamptz,deadline_at timestamptz,
 completed_at timestamptz,
 payout_status text not null default 'pending' check(payout_status in ('pending','approved','paid')),
 paid_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists tasks_assignments_idx on public.tasks(assigned_to,status);
create index if not exists tasks_expiry_idx on public.tasks(status,deadline_at);
alter table public.orders drop constraint if exists order_linked_task_fk;
alter table public.orders add constraint order_linked_task_fk foreign key(linked_task_id) references public.tasks(id) on delete set null;

create table if not exists public.task_briefs (
 task_id text primary key references public.tasks(id) on delete cascade,
 brief text not null, assets jsonb not null default '[]'::jsonb
);

create table if not exists public.task_submissions (
 id uuid primary key default gen_random_uuid(), task_id text not null references public.tasks(id) on delete cascade,
 designer_id uuid not null references public.profiles(id), file_name text not null,
 file_path text not null, file_size integer not null check(file_size between 1 and 20971520),
 submitted_at timestamptz not null default now()
);
create index if not exists submissions_task_idx on public.task_submissions(task_id,submitted_at desc);

create table if not exists public.penalties (
 id uuid primary key default gen_random_uuid(), designer_id uuid not null references public.profiles(id),
 task_id text not null references public.tasks(id), level integer not null check(level between 1 and 5),
 hours integer not null default 0, suspended_until timestamptz, created_at timestamptz not null default now(),
 unique(designer_id,task_id)
);
create index if not exists penalties_designer_idx on public.penalties(designer_id,created_at desc);

create table if not exists public.giving_articles (
 id text primary key, slug text not null unique, title text not null, category text not null,
 excerpt text not null, content text not null, cover text not null, cover_tone text not null default 'pink',
 published boolean not null default false, kind text not null check(kind in ('intro','activity')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);

-- Least-privilege Data API policies.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.custom_prices enable row level security;
alter table public.shop_settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_events enable row level security;
alter table public.tasks enable row level security;
alter table public.task_briefs enable row level security;
alter table public.task_submissions enable row level security;
alter table public.penalties enable row level security;
alter table public.giving_articles enable row level security;

create policy "profile reads own or admin" on public.profiles for select to authenticated
 using (id=(select auth.uid()) or (select private.is_admin()));
create policy "profile edits own public preferences" on public.profiles for update to authenticated
 using (id=(select auth.uid())) with check (id=(select auth.uid()));
-- No client may modify role/approval/email through the Data API.
revoke update on public.profiles from authenticated;
grant update(name,show_earnings_on_leaderboard) on public.profiles to authenticated;

create policy "published product catalog anon" on public.products for select to anon using(published);
create policy "published product catalog authenticated" on public.products for select to authenticated
 using (published or (select private.is_admin()));
create policy "read public custom prices" on public.custom_prices for select to anon,authenticated using(true);
create policy "read payment destinations" on public.shop_settings for select to anon,authenticated using(true);
create policy "own or admin orders" on public.orders for select to authenticated
 using (customer_id=(select auth.uid()) or (select private.is_admin()));
create policy "own or admin order events" on public.order_events for select to authenticated
 using (exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or (select private.is_admin()))));
create policy "public task summaries" on public.tasks for select to anon,authenticated using(true);
create policy "brief restricted to assignee" on public.task_briefs for select to authenticated
 using ((select private.is_admin()) or exists(select 1 from public.tasks t where t.id=task_id and t.assigned_to=(select auth.uid())));
create policy "submission for owner or admin" on public.task_submissions for select to authenticated
 using(designer_id=(select auth.uid()) or (select private.is_admin()));
create policy "penalties for self or admin" on public.penalties for select to authenticated
 using(designer_id=(select auth.uid()) or (select private.is_admin()));
create policy "published stories anon" on public.giving_articles for select to anon using(published);
create policy "published stories authenticated" on public.giving_articles for select to authenticated
 using(published or (select private.is_admin()));

-- Explicit table grants work even when projects disable auto-exposure via Data API.
grant usage on schema public to anon, authenticated, service_role;
grant select on public.products,public.custom_prices,public.shop_settings,public.tasks,public.giving_articles to anon,authenticated;
grant select on public.profiles,public.orders,public.order_events,public.task_briefs,public.task_submissions,public.penalties to authenticated;
-- Only server (service role) performs high-impact writes, via secured API.
revoke insert,delete on public.profiles,public.orders,public.order_events,public.tasks,public.task_briefs,
 public.task_submissions,public.penalties,public.products,public.custom_prices,public.shop_settings,public.giving_articles from anon,authenticated;
revoke update on public.orders,public.order_events,public.tasks,public.task_briefs,
 public.task_submissions,public.penalties,public.products,public.custom_prices,public.shop_settings,public.giving_articles from anon,authenticated;

-- Atomic claiming and expiration. service_role-only entrypoints, identity checked in API.
create or replace function public.backend_expire_tasks() returns integer
language plpgsql security definer set search_path='public,pg_temp' as $$
declare row_task record; v_count integer:=0; v_level integer; v_hours integer;
begin
 for row_task in select * from public.tasks where status='in_progress' and deadline_at<=now() for update skip locked loop
  select least(5,count(*)::integer+1) into v_level from public.penalties where designer_id=row_task.assigned_to;
  v_hours:=case when v_level=5 then 0 else (8*power(2,v_level-1))::integer end;
  insert into public.penalties(designer_id,task_id,level,hours,suspended_until)
  values(row_task.assigned_to,row_task.id,v_level,v_hours,case when v_level=5 then null else now()+make_interval(hours=>v_hours) end)
  on conflict(designer_id,task_id) do nothing;
  update public.tasks set status='available',assigned_to=null,assigned_name=null,claimed_at=null,deadline_at=null
   where id=row_task.id;
  v_count:=v_count+1;
 end loop;
 return v_count;
end;
$$;

create or replace function public.backend_claim_task(p_task_id text,p_designer uuid)
returns jsonb language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_task public.tasks%rowtype; v_profile public.profiles%rowtype;v_penalty record;
begin
 perform public.backend_expire_tasks();
 select * into v_profile from public.profiles where id=p_designer;
 if v_profile.id is null or v_profile.role<>'designer' or not v_profile.designer_approved then
  raise exception 'Designer approval is required before claiming tasks'; end if;
 select * into v_penalty from public.penalties where designer_id=p_designer
  and (suspended_until is null or suspended_until>now()) limit 1;
 if found then raise exception 'Your commission account is currently suspended';end if;
 if exists(select 1 from public.tasks where assigned_to=p_designer and status in ('in_progress','revision')) then
  raise exception 'Finish your current assignment before claiming another';end if;
 select * into v_task from public.tasks where id=p_task_id for update;
 if not found or v_task.status<>'available' then raise exception 'This task has already been claimed';end if;
 update public.tasks set status='in_progress',assigned_to=p_designer,assigned_name=v_profile.name,
 claimed_at=now(),deadline_at=now()+make_interval(hours=>v_task.duration_hours)
 where id=p_task_id;
 return jsonb_build_object('ok',true,'task_id',p_task_id);
end;
$$;

create or replace function public.backend_submit_task(p_task_id text,p_designer uuid,p_path text,p_name text,p_size integer)
returns jsonb language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_task public.tasks%rowtype;
begin
 select * into v_task from public.tasks where id=p_task_id for update;
 if not found or v_task.assigned_to is distinct from p_designer or v_task.status not in ('in_progress','revision') then
  raise exception 'Task is not assigned to this designer'; end if;
 if v_task.deadline_at is not null and v_task.deadline_at<=now() then
  if v_task.status='in_progress' then perform public.backend_expire_tasks(); end if;
  raise exception 'Submission deadline has passed'; end if;
 if p_size<1 or p_size>20971520 or left(p_path,length(p_designer::text)+1)<>p_designer::text||'/' then
  raise exception 'Invalid file metadata';end if;
 insert into public.task_submissions(task_id,designer_id,file_path,file_name,file_size)
 values(p_task_id,p_designer,p_path,left(p_name,255),p_size);
 update public.tasks set status='under_review' where id=p_task_id;
 return jsonb_build_object('ok',true,'task_id',p_task_id);
end;
$$;

revoke all on function public.backend_expire_tasks() from public,anon,authenticated;
revoke all on function public.backend_claim_task(text,uuid) from public,anon,authenticated;
revoke all on function public.backend_submit_task(text,uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.backend_expire_tasks() to service_role;
grant execute on function public.backend_claim_task(text,uuid) to service_role;
grant execute on function public.backend_submit_task(text,uuid,text,text,integer) to service_role;

-- Checkout is one transaction: verify stock with row locks, reserve inventory, create order and event.
create or replace function public.backend_create_order(p_data jsonb,p_items jsonb,p_lines jsonb)
returns text language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_item jsonb;v_product public.products%rowtype;v_q integer;v_code text;v_checkout uuid;v_customer uuid;
begin
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>40 then
  raise exception 'Invalid cart';end if;
 v_checkout:=(p_data->>'checkout_token')::uuid;v_customer:=(p_data->>'customer_id')::uuid;
 -- A safe retry with the same token returns the original order without double-reserving stock.
 perform pg_advisory_xact_lock(hashtextextended('COCIOCO-ORDERS:'||v_customer::text,0));
 select id into v_code from public.orders where customer_id=v_customer and checkout_token=v_checkout;
 if found then return v_code;end if;
 if (select count(*) from public.orders where customer_id=v_customer and payment_status in ('awaiting_payment','pending_verification'))>=5 then
   raise exception 'Too many pending orders. Please resolve older orders with COCIOCO first';end if;
 for v_item in select * from jsonb_array_elements(p_items) loop
  v_q:=(v_item->>'quantity')::integer;
  if v_q<1 or v_q>100 then raise exception 'Invalid quantity';end if;
  if v_item->'custom' is null then
   select * into v_product from public.products where id=v_item->>'productId' and published=true for update;
   if not found then raise exception 'Product no longer available';end if;
   if v_product.category='physical' then
    if v_product.stock<v_q then raise exception 'Insufficient stock for %',v_product.name;end if;
    update public.products set stock=stock-v_q where id=v_product.id;
   end if;
  end if;
 end loop;
 v_code:='CC-'||to_char(now(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,9));
 insert into public.orders(id,customer_id,checkout_token,customer_name,email,phone,address,country,currency,fx_rate,
  fx_source,fx_as_of,total_idr,amount_due,items,lines,payment_method,collector_alias,leaderboard_opt_in)
 values(v_code,v_customer,v_checkout,p_data->>'customer_name',p_data->>'email',p_data->>'phone',
  coalesce(p_data->>'address',''),p_data->>'country',p_data->>'currency',
  (p_data->>'fx_rate')::numeric,p_data->>'fx_source',coalesce(p_data->>'fx_as_of',''),
  (p_data->>'total_idr')::integer,(p_data->>'amount_due')::numeric,
  p_items,p_lines,p_data->>'payment_method',nullif(p_data->>'collector_alias',''),
  coalesce((p_data->>'leaderboard_opt_in')::boolean,false));
 insert into public.order_events(order_id,status,note)
 values(v_code,'awaiting_payment','Order received. Awaiting manual payment verification.');
 return v_code;
end;$$;

create or replace function public.backend_admin_payment(p_order text,p_status text,p_actor uuid)
returns void language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_existing public.orders%rowtype;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') then raise exception 'Admin only';end if;
 if p_status not in ('awaiting_payment','pending_verification','verified','rejected') then raise exception 'Invalid payment status';end if;
 select * into v_existing from public.orders where id=p_order for update;
 if not found then raise exception 'Order not found';end if;
 if v_existing.payment_status='verified' and p_status<>'verified' then
  raise exception 'Verified orders require a manual refund workflow, not payment-status reversal';end if;
 if v_existing.payment_status='rejected' and p_status<>'rejected' then
  raise exception 'Rejected orders are closed. Ask the customer to place a new order';end if;
 if p_status='rejected' and v_existing.stock_reserved then
  update public.products p set stock=p.stock+x.qty
   from (select (item->>'productId') as product_id,sum((item->>'quantity')::integer)::integer as qty
    from jsonb_array_elements(v_existing.items) item where item->'custom' is null
    group by item->>'productId') x
   where p.id=x.product_id and p.category='physical';
 end if;
 update public.orders set payment_status=p_status,
  stock_reserved=case when p_status='rejected' then false else stock_reserved end,
  fulfillment_status=case when p_status='verified' and fulfillment_status='awaiting_payment' then 'confirmed'
    when p_status='rejected' then 'cancelled' else fulfillment_status end
  where id=p_order;
 if p_status='rejected' and v_existing.payment_status<>'rejected' then
  insert into public.order_events(order_id,status,note,actor_id)
  values(p_order,'cancelled','Unpaid order rejected by COCIOCO; inventory reservation released.',p_actor);
 end if;
 if p_status='verified' and v_existing.payment_status<>'verified' then
  insert into public.order_events(order_id,status,note,actor_id)
  values(p_order,'confirmed','Payment verified by COCIOCO admin.',p_actor);
 end if;
end;$$;

create or replace function public.backend_admin_tracking(p_order text,p_status text,p_note text,p_courier text,p_resi text,p_actor uuid)
returns void language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_order public.orders%rowtype;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') then raise exception 'Admin only';end if;
 if p_status not in ('awaiting_payment','confirmed','design_review','preparing','packing','handed_to_courier','in_transit','delivered','cancelled') then
  raise exception 'Invalid delivery status';end if;
 select * into v_order from public.orders where id=p_order for update;
 if not found then raise exception 'Order not found';end if;
 if p_status not in ('awaiting_payment','cancelled') and v_order.payment_status<>'verified' then
  raise exception 'Payment must be verified first';end if;
 update public.orders set fulfillment_status=p_status,courier=left(coalesce(p_courier,''),80),
  tracking_number=left(coalesce(p_resi,''),100) where id=p_order;
 insert into public.order_events(order_id,status,note,actor_id)
 values(p_order,p_status,left(coalesce(nullif(trim(p_note),''),'Status updated by COCIOCO.'),350),p_actor);
end;$$;

create or replace function public.backend_admin_create_task(p_data jsonb,p_actor uuid)
returns text language plpgsql security definer set search_path='public,pg_temp' as $$
declare v_id text; v_order text;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') then raise exception 'Admin only';end if;
 v_order:=nullif(p_data->>'order_id','');
 if v_order is not null then
  perform 1 from public.orders where id=v_order and payment_status='verified' and linked_task_id is null
   and exists (select 1 from jsonb_array_elements(lines) l where l->'custom'->>'designService'='designer') for update;
  if not found then raise exception 'Order is not eligible for a designer task';end if;
 end if;
 v_id:='CO-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.tasks(id,title,category,description,reward,duration_hours,art,tone,skills,deliverables)
 values(v_id,left(p_data->>'title',200),left(coalesce(p_data->>'category','Design'),80),
  left(coalesce(p_data->>'description',''),2000), (p_data->>'reward')::integer,8,
  '/assets/elements.svg','pink',array['Creative Design'],array['Editable source','Exported deliverables']);
 insert into public.task_briefs(task_id,brief)
 values(v_id,coalesce(p_data->>'brief',''));
 if v_order is not null then update public.orders set linked_task_id=v_id where id=v_order;end if;
 return v_id;
end;$$;

revoke all on function public.backend_create_order(jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.backend_admin_payment(text,text,uuid) from public,anon,authenticated;
revoke all on function public.backend_admin_tracking(text,text,text,text,text,uuid) from public,anon,authenticated;
revoke all on function public.backend_admin_create_task(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.backend_create_order(jsonb,jsonb,jsonb) to service_role;
grant execute on function public.backend_admin_payment(text,text,uuid) to service_role;
grant execute on function public.backend_admin_tracking(text,text,text,text,text,uuid) to service_role;
grant execute on function public.backend_admin_create_task(jsonb,uuid) to service_role;

-- Opt-in-only leaderboard RPC (public, intentionally no email/PII).
create or replace function public.cocioco_leaderboards(p_period text default 'all') returns jsonb
language plpgsql stable security definer set search_path='public,pg_temp' as $$
declare v_creators jsonb;v_collectors jsonb;v_since timestamptz;
begin
 if p_period not in ('all','month') then raise exception 'Invalid period';end if;
 v_since:=case when p_period='month' then now()-interval '30 days' else '2000-01-01'::timestamptz end;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.projects desc,x.earnings desc),'[]'::jsonb) into v_creators
 from (
  select p.id,p.name as alias,count(*)::integer as projects,
   case when p.show_earnings_on_leaderboard then sum(t.reward)::integer else 0 end as earnings,
   p.show_earnings_on_leaderboard as "earningsPublic"
  from public.tasks t join public.profiles p on p.id=t.assigned_to
  where t.status='completed' and coalesce(t.completed_at,t.created_at)>=v_since
  group by p.id,p.name,p.show_earnings_on_leaderboard
  order by projects desc limit 50
 ) x;
 select coalesce(jsonb_agg(to_jsonb(x) order by x.points desc),'[]'::jsonb) into v_collectors
 from (
   select q.customer_id::text as id,max(q.collector_alias) as alias,
    count(*)::integer as orders,sum(q.order_points)::integer as points
   from (
    select o.customer_id,o.collector_alias,
     100+20*coalesce((select sum((e->>'quantity')::integer) from jsonb_array_elements(o.items) e),0) as order_points
    from public.orders o where o.payment_status='verified' and o.fulfillment_status<>'cancelled'
     and o.leaderboard_opt_in=true and o.collector_alias is not null and o.created_at>=v_since
   ) q group by q.customer_id order by points desc limit 50
 ) x;
 return jsonb_build_object('creators',v_creators,'collectors',v_collectors);
end;$$;
revoke all on function public.cocioco_leaderboards(text) from public;
grant execute on function public.cocioco_leaderboards(text) to anon,authenticated;

-- Private storage buckets and explicit, scoped Storage RLS policies.
insert into storage.buckets(id,name,public,file_size_limit) values
 ('cocioco-custom-art','cocioco-custom-art',false,15728640),
 ('cocioco-task-submissions','cocioco-task-submissions',false,20971520),
 ('cocioco-task-assets','cocioco-task-assets',false,20971520),
 ('cocioco-digital-goods','cocioco-digital-goods',false,104857600)
on conflict(id) do nothing;

create policy "custom artwork owner upload" on storage.objects for insert to authenticated
 with check(bucket_id='cocioco-custom-art' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "custom artwork owner read" on storage.objects for select to authenticated
 using(bucket_id='cocioco-custom-art' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));
create policy "submission owner upload" on storage.objects for insert to authenticated
 with check(bucket_id='cocioco-task-submissions' and (storage.foldername(name))[1]=(select auth.uid())::text
  and exists(select 1 from public.tasks t where t.id=(storage.foldername(name))[2]
   and t.assigned_to=(select auth.uid()) and (t.status='revision' or (t.status='in_progress' and t.deadline_at>now()))));
create policy "submission owner read" on storage.objects for select to authenticated
 using(bucket_id='cocioco-task-submissions' and ((storage.foldername(name))[1]=(select auth.uid())::text or (select private.is_admin())));
create policy "task assets assignee read" on storage.objects for select to authenticated
 using(bucket_id='cocioco-task-assets' and ((select private.is_admin()) or exists(select 1 from public.tasks t
    where t.id=(storage.foldername(name))[1] and t.assigned_to=(select auth.uid()))));
create policy "task assets admin upload" on storage.objects for insert to authenticated
 with check(bucket_id='cocioco-task-assets' and (select private.is_admin()));
create policy "digital goods purchaser read" on storage.objects for select to authenticated
 using(bucket_id='cocioco-digital-goods' and ((select private.is_admin()) or exists(
   select 1 from public.products p join public.orders o on o.customer_id=(select auth.uid())
   where p.digital_asset_path=name and o.payment_status='verified' and o.fulfillment_status<>'cancelled'
    and exists (select 1 from jsonb_array_elements(o.items) item where item->>'productId'=p.id)
 )));
create policy "digital goods admin upload" on storage.objects for insert to authenticated
 with check(bucket_id='cocioco-digital-goods' and (select private.is_admin()));

-- Seed the same sample product catalog as Phase A, but NOT fictional jobs or impact reports.
insert into public.products(id,slug,name,category,collection,price,image,badge,color,description,includes,stock)
values
('p1','dreamy-day-binder','Dreamy Day Photocard Binder','physical','Dream Club',189000,'/assets/binder.svg','BEST SELLER','#dac5ff','Your favorite photocards deserve the cutest little home.',array['A6 binder with 20 sleeves','Holographic front cover'],24),
('p2','lucky-love-keychain','Lucky Love Charm Keychain','physical','Lucky Things',49000,'/assets/keychain.svg','CUTE PICK','#ffb6de','A little good luck for your everyday carry.',array['Glossy acrylic charm','Silver-tone key ring'],38),
('p3','star-girl-photocard','Star Girl Photocard Set','physical','Star Girl',79000,'/assets/photocards.svg','NEW DROP','#dded8f','A playful set of collectible illustrated cards.',array['6 illustrated photocards','Glossy double-sided print'],16),
('p4','sugar-rush-card-holder','Sugar Rush Card Holder','physical','Sweet Escape',69000,'/assets/cardholder.svg',null,'#efc2f3','A candy-colored holder for your favorite cards.',array['Durable card holder','Attachable strap'],30),
('p5','pop-type-font-bundle','POP TYPE — Font Bundle','digital','Creator Toolkit',99000,'/assets/fonts.svg','DIGITAL','#c4f1c0','Playful curated display font collection.',array['4 display font families','License details'],999),
('p6','kpop-sparkle-elements','K-POP Sparkle Elements','digital','Creator Toolkit',59000,'/assets/elements.svg','DIGITAL','#ffd8ed','K-pop-inspired graphic elements.',array['Original graphic elements','Editable SVG versions'],999),
('p7','ribbon-replay-templates','Ribbon Replay Template Kit','digital','Creator Toolkit',125000,'/assets/templates.svg',null,'#d8c6ff','Creative editorial layout templates.',array['12 social media layouts','Editable Figma templates'],999),
('p8','pixel-heart-stickers','Pixel Heart Sticker Pack','digital','Creator Toolkit',39000,'/assets/pixels.svg','NEW','#e9ee98','Nostalgic pixel-style icon stickers.',array['60 original stickers','Editable SVG versions'],999)
on conflict(id) do nothing;
insert into public.custom_prices(id,base,design_fee) values
('collection-book',299000,160000),('card-holder',149000,110000),('keychain',99000,95000),('photocard-set',159000,130000)
on conflict(id) do nothing;

-- IMPORTANT: Bootstrap first admin only AFTER they register via Supabase Auth and verify email:
-- update public.profiles set role='admin' where id='REPLACE_WITH_VERIFIED_USER_UUID';
-- Never grant admin based solely on email entered by the user during sign-up.
-- Recommended: configure Supabase Cron to run SELECT public.backend_expire_tasks()
-- every minute under a privileged role; the API also lazily expires tasks on claim.
