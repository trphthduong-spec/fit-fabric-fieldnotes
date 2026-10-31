import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProductReviews, type ReviewUser } from "@/components/reviews/ProductReviews";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Product Reviews — Fit, Fabric & Delivery" },
      { name: "description", content: "Athletic apparel reviews with fit, fabric performance, buyer stats and photos." },
      { property: "og:title", content: "Product Reviews — Fit, Fabric & Delivery" },
      { property: "og:description", content: "Athletic apparel reviews with fit, fabric performance, buyer stats and photos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

// Preview-only: simulates who is logged in. On the real site, pass the
// logged-in user from your auth (with isAdmin from your roles table) instead.
const PREVIEW_USERS: Record<string, ReviewUser | null> = {
  guest: null,
  customer: { id: "preview-customer", name: "Demo Customer" },
  admin: { id: "preview-admin", name: "Store Team", isAdmin: true },
};

function Index() {
  const [who, setWho] = useState("guest");
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Preview as:</span>
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Preview as"
          className="rounded-md border border-input bg-card px-2 py-1 text-xs">
          <option value="guest">Guest (not logged in)</option>
          <option value="customer">Logged-in customer</option>
          <option value="admin">Shop admin</option>
        </select>
      </div>
      <ProductReviews currentUser={PREVIEW_USERS[who] ?? null} />
      <Toaster position="bottom-center" />
    </main>
  );
}
