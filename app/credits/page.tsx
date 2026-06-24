"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface CreditsData {
  balance: number;
  transactions: Transaction[];
}

const PACKS = [
  {
    key: "pack_starter",
    name: "Starter",
    price: 9.99,
    credits: 50,
    analyses: 5,
  },
  {
    key: "pack_standard",
    name: "Standard",
    price: 19.99,
    credits: 120,
    analyses: 12,
    popular: true,
  },
  {
    key: "pack_pro",
    name: "Pro",
    price: 39.99,
    credits: 300,
    analyses: 30,
  },
] as const;

export default function CreditsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    if (!session) return;

    fetch("/api/credits")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [session, status, router]);

  async function handleCheckout(priceKey: string) {
    setCheckoutError(null);
    setCheckoutLoading(priceKey);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price_key: priceKey,
          success_url: `${window.location.origin}/?payment=success`,
          cancel_url: window.location.href,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.checkout_url) {
        setCheckoutError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      window.location.href = json.checkout_url;
    } catch {
      setCheckoutError("Something went wrong. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-100" />
          <div className="mt-4 h-4 w-72 animate-pulse rounded bg-gray-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-12">

        {/* Breadcrumb */}
        <Link href="/" className="text-sm text-indigo-600 hover:underline">
          ← Back
        </Link>

        {/* Header */}
        <div className="mt-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Credits</h1>
            <p className="mt-1 text-sm text-gray-500">
              10 credits = 1 analysis · Credits never expire
            </p>
          </div>
          <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
            {data?.balance ?? 0} credits remaining
          </div>
        </div>

        {/* Pack cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PACKS.map((pack) => {
            const pricePerCredit = (pack.price / pack.credits).toFixed(2);
            const isBuying = checkoutLoading === pack.key;
            const anyBuying = checkoutLoading !== null;

            return (
              <div
                key={pack.key}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  "popular" in pack && pack.popular
                    ? "border-indigo-400 bg-indigo-50 shadow-md"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {"popular" in pack && pack.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}

                <p className="text-sm font-semibold text-gray-500">{pack.name}</p>

                <p className="mt-2 text-3xl font-extrabold text-gray-900">
                  ${pack.price}
                </p>

                <div className="mt-4 space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{pack.credits}</span> credits
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{pack.analyses}</span> analyses
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">${pricePerCredit}</span> per credit
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(pack.key)}
                  disabled={anyBuying}
                  className={`cursor-pointer mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    "popular" in pack && pack.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  {isBuying ? "Redirecting…" : "Buy"}
                </button>
              </div>
            );
          })}
        </div>

        {checkoutError && (
          <p className="mt-4 text-center text-sm text-red-600">{checkoutError}</p>
        )}

        <p className="mt-4 text-center text-xs text-gray-400">
          One-time purchase · No subscription · Secure checkout via Stripe
        </p>

        {/* Transaction history */}
        <div className="mt-14">
          <h2 className="text-base font-semibold text-gray-900">Transaction history</h2>

          {!data?.transactions?.length ? (
            <p className="mt-4 text-sm text-gray-400">No transactions yet.</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              {data.transactions.map((tx, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-3.5 text-sm ${
                    i !== 0 ? "border-t border-gray-100" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{tx.description || tx.type}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-semibold ${
                      tx.amount > 0 ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {tx.amount > 0 ? "+" : ""}
                    {tx.amount} cr
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
