"use client";

import { useState } from "react";
import { Rocket } from "lucide-react";
import { useGame } from "@/components/game/game-provider";
import { usePiAuth } from "@/contexts/pi-auth-context";
import { PRODUCT_CONFIG } from "@/lib/product-config";

type PurchaseErrorCode =
  | "product_not_found"
  | "purchase_cancelled"
  | "purchase_error";

const ERROR_MESSAGES: Record<PurchaseErrorCode, string> = {
  product_not_found: "Produk tidak ditemukan.",
  purchase_cancelled: "Pembelian dibatalkan.",
  purchase_error: "Pembelian gagal. Coba lagi nanti.",
};

const buttonClass =
  "flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground";

export function BoostPurchaseCard() {
  const auth = usePiAuth();
  const { activatePurchasedBoost, notify, state, now } = useGame();
  const [busy, setBusy] = useState(false);

  const remainingMs = state.boost ? Math.max(0, state.boost.until - now) : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const remainingLabel = `${Math.floor(remainingSeconds / 60)}:${String(
    remainingSeconds % 60,
  ).padStart(2, "0")}`;

  const sdk = auth?.sdk ?? null;
  const products = auth?.products ?? [];
  const product = products.find(
    (p) => p.id === PRODUCT_CONFIG.PRODUCT_6aeef52d7198076dc1d98a01,
  );
  const quantity = product
    ? (auth?.restoredPurchases?.find((p) => p.productId === product.slug)
        ?.quantity ?? 0)
    : 0;

  async function handleBuy() {
    if (!sdk || !product || busy) return;
    setBusy(true);
    try {
      const result = await sdk.makePurchase(product.slug);
      if (result.ok) {
        await auth?.refreshPurchases();
        notify(`${product.name} berhasil dibeli!`, "success");
      }
    } catch (error) {
      const code = (error as { code?: PurchaseErrorCode }).code;
      notify(
        ERROR_MESSAGES[code ?? "purchase_error"] ?? ERROR_MESSAGES.purchase_error,
        code === "purchase_cancelled" ? "info" : "warn",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUse() {
    if (!sdk || !product || busy || quantity < 1) return;
    setBusy(true);
    try {
      await sdk.state.consume(product.slug, 1);
      activatePurchasedBoost();
      await auth?.refreshPurchases();
    } catch (error) {
      console.error("[CT POOL] Gagal memakai boost:", error);
      notify("Boost gagal diaktifkan. Coba lagi.", "warn");
    } finally {
      setBusy(false);
    }
  }

  const loading = auth?.products === null || auth?.products === undefined;

  return (
    <section
      aria-label="Beli boost"
      className="flex flex-col gap-3 rounded-2xl border border-primary bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Rocket className="size-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{product?.name ?? "Boosts"}</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {product?.description ?? "Current lockup boost"}
          </p>
        </div>
        <p className="shrink-0 text-sm font-bold tabular-nums text-muted-foreground">
          Dimiliki: {quantity}
        </p>
      </div>

      <button
        type="button"
        onClick={handleBuy}
        disabled={!product || !sdk || busy}
        className={`${buttonClass} bg-primary text-primary-foreground`}
      >
        {busy
          ? "Memproses..."
          : product
            ? `Beli ${product.name} - ${product.price_in_pi} Pi`
            : loading
              ? "Memuat produk..."
              : "Produk tidak tersedia"}
      </button>

      {quantity > 0 && (
        <button
          type="button"
          onClick={handleUse}
          disabled={busy}
          className={`${buttonClass} bg-accent text-accent-foreground`}
        >
          Pakai Boost (x2 selama 10 menit)
        </button>
      )}

      {remainingMs > 0 && (
        <p
          role="timer"
          aria-label="Sisa waktu boost"
          className="text-center text-sm font-bold tabular-nums text-primary"
        >
          Boost aktif x{state.boost?.mult} - sisa {remainingLabel}
        </p>
      )}

      {!loading && !product && (
        <p role="alert" className="text-center text-xs text-destructive">
          Produk Boosts belum tersedia saat ini.
        </p>
      )}
    </section>
  );
}
