"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";

interface Transaction {
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface UserCredits {
  balance: number;
  transactions: Transaction[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();

  const [lookupId, setLookupId] = useState("");
  const [lookupResult, setLookupResult] = useState<UserCredits | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  if (status === "loading") return null;

  if (!session || session.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500">Access denied.</p>
          <Link href="/" className="mt-3 block text-sm text-blue-600 hover:underline">
            Back to app
          </Link>
        </div>
      </main>
    );
  }

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const res = await fetch(`/api/admin/user/${encodeURIComponent(lookupId.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data?.error ?? `Error ${res.status}`);
      } else {
        setLookupResult(data);
        setUserId(lookupId.trim());
      }
    } catch {
      setLookupError("Network error.");
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleAddCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim() || !amount || !description.trim()) return;
    setSubmitLoading(true);
    setSubmitSuccess("");
    setSubmitError("");

    try {
      const res = await fetch("/api/admin/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId.trim(),
          amount: Number(amount),
          description: description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error ?? `Error ${res.status}`);
      } else {
        setSubmitSuccess(`Added ${amount} credits to ${userId}.`);
        setAmount("");
        setDescription("");
      }
    } catch {
      setSubmitError("Network error.");
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-gray-900">Admin Panel</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to app
          </Link>
        </div>

        {/* User Lookup */}
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">User Lookup</h2>
          <form onSubmit={handleLookup} className="flex gap-3">
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Google user ID (sub)"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={lookupLoading || !lookupId.trim()}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lookupLoading ? "Looking up…" : "Look up"}
            </button>
          </form>

          {lookupError && (
            <p className="mt-3 text-sm text-red-600">{lookupError}</p>
          )}

          {lookupResult && (
            <div className="mt-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Current balance</span>
                <span className="text-xl font-extrabold text-gray-900">
                  {lookupResult.balance} credit{lookupResult.balance !== 1 ? "s" : ""}
                </span>
              </div>

              {lookupResult.transactions.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Description</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Type</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Amount</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lookupResult.transactions.map((t, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-700">{t.description}</td>
                          <td className="px-3 py-2 text-gray-400">{t.type}</td>
                          <td className={`px-3 py-2 text-right font-mono font-semibold ${t.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {t.amount > 0 ? "+" : ""}{t.amount}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-400">
                            {new Date(t.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <button
                onClick={() => setUserId(lookupId.trim())}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Add credits to this user ↓
              </button>
            </div>
          )}
        </section>

        {/* Add Credits */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Add Credits</h2>
          <form onSubmit={handleAddCredits} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">User ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Google user ID (sub)"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10"
                min="1"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Business plan deal"
                list="desc-presets"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <datalist id="desc-presets">
                <option value="Business plan deal" />
                <option value="Refund — analysis failed" />
                <option value="Testing credits" />
                <option value="Promo credits" />
              </datalist>
            </div>

            <button
              type="submit"
              disabled={submitLoading || !userId.trim() || !amount || !description.trim()}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitLoading ? "Adding…" : "Add Credits"}
            </button>
          </form>

          {submitSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {submitSuccess}
            </div>
          )}
          {submitError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
