-- Lets a contact be a looked-up company (siret + the official
-- denomination it resolves to, stored in nom) rather than only ever a
-- free-typed name — plus an alias (how the owner actually refers to
-- them day-to-day) and an optional named interlocutor at that company,
-- kept separate from nom since the two can legitimately differ.
alter table public.contacts
  add column siret text,
  add column alias text,
  add column interlocuteur_prenom text,
  add column interlocuteur_nom text;
