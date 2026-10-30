import { createFileRoute } from "@tanstack/react-router";
import { ProductReviews } from "@/components/reviews/ProductReviews";
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

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <ProductReviews />
      <Toaster position="bottom-center" />
    </main>
  );
}
