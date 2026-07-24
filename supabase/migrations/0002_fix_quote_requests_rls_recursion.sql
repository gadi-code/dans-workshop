-- quote_requests_select and qrp_select referenced each other, causing
-- "infinite recursion detected in policy for relation quote_requests".
-- Break the cycle with a SECURITY DEFINER helper that bypasses RLS
-- internally (same pattern as friend_provider_history).

create or replace function is_invited_provider_owner(request_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from quote_request_providers qrp
    join providers p on p.id = qrp.provider_id
    where qrp.quote_request_id = request_id and p.owner_profile_id = auth.uid()
  );
$$;

grant execute on function is_invited_provider_owner(uuid) to authenticated;

drop policy "quote_requests_select" on quote_requests;
create policy "quote_requests_select" on quote_requests for select
  using (
    customer_profile_id = auth.uid()
    or is_invited_provider_owner(quote_requests.id)
  );
