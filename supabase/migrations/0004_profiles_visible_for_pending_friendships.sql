-- A pending friend request needs to show the other party's name to both
-- the requester and the addressee, not just once it's accepted.
drop policy "profiles_select" on profiles;
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from friendships f
      where f.status in ('accepted', 'pending')
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
