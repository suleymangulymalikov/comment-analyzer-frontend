import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backendHeaders } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.price_key || !body?.success_url || !body?.cancel_url) {
    return NextResponse.json(
      { error: "price_key, success_url, and cancel_url are required" },
      { status: 400 }
    );
  }

  const ALLOWED_PRICE_KEYS = ["pack_starter", "pack_standard", "pack_pro"];
  if (!ALLOWED_PRICE_KEYS.includes(body.price_key)) {
    return NextResponse.json({ error: "Invalid price_key" }, { status: 400 });
  }

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/payments/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...backendHeaders(session.user.id) },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the backend." }, { status: 502 });
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail ?? data?.error ?? `Backend returned ${response.status}`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  return NextResponse.json(data);
}
