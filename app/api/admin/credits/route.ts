import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backendHeaders } from "@/lib/backend";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.user_id || body?.amount === undefined || !body?.description) {
    return NextResponse.json(
      { error: "user_id, amount, and description are required" },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_URL;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!backendUrl || !adminSecret) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/admin/credits`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminSecret,
        ...backendHeaders(),
      },
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
