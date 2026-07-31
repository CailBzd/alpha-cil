-- Security audit (2026-07-31) finding: artisans_update_self let an artisan
-- update every column on their own row via a blanket `grant update`,
-- including siret — the UI (SocieteForm) never sends it, but nothing
-- stopped a direct `supabase.from("artisans").update({siret: ...})` call
-- from rewriting an already SIRET-verified row to any other 14-digit
-- number, undermining the one thing that verification was for. Restricting
-- the grant to exactly the columns the app's own forms (SocieteForm,
-- DecennaleForm) ever write closes this without touching any legitimate
-- flow — siret can now only ever be set once, at insert (artisan signup).
revoke update on public.artisans from authenticated;

grant update (
  denomination, adresse, telephone, corps_metier,
  attestation_decennale_path, attestation_decennale_uploaded_at
) on public.artisans to authenticated;
