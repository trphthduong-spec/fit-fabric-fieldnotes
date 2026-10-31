# Connecting the reviews to your real site

`<ProductReviews>` props:
- `currentUser` — `{ id, name, isAdmin }` from your login. Logged-in users are never asked for a nickname; `isAdmin: true` shows the Shop Admin badge and lets them post announcements (no rating, not counted in scores).
- `productId` — one review list per product.
- `store` — where reviews are saved. Default: the visitor's browser (localStorage), which survives refresh but is NOT shared between visitors. On the live site pass a database store so everyone sees the same reviews.

## Supabase example

```sql
create table public.product_reviews (
  product_id text primary key,
  data jsonb not null default '[]'
);
grant select on public.product_reviews to anon, authenticated;
grant insert, update on public.product_reviews to authenticated;
alter table public.product_reviews enable row level security;
create policy "read" on public.product_reviews for select using (true);
create policy "write" on public.product_reviews for all to authenticated using (true) with check (true);
```

```ts
const store: ReviewStore = {
  load: async () => (await supabase.from("product_reviews").select("data").eq("product_id", id).maybeSingle()).data?.data ?? null,
  save: async (reviews) => { await supabase.from("product_reviews").upsert({ product_id: id, data: reviews }); },
};
<ProductReviews productId={id} store={store} currentUser={user} />
```

For production, prefer one row per review/reply with owner-only delete policies, admin checks via a `user_roles` table, and photos in Storage instead of inline images.
