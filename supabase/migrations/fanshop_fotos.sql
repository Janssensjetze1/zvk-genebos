-- ─── Fanshop: meer foto's per product ────────────────────────────────────────
--
-- foto_url blijft de hoofdfoto (op de tegel in de collectie en als eerste in
-- het productpaneel). fotos bevat de extra foto's, in de volgorde waarin ze
-- na de hoofdfoto getoond worden (Jetze, 2026-11-04).
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.shop_producten
  add column if not exists fotos text[] not null default '{}'
    check (cardinality(fotos) <= 12);
