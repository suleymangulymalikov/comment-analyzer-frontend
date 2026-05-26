import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backendHeaders } from "@/lib/backend";

export async function GET(_req: Request, ctx: RouteContext<"/api/admin/user/[userId]">) {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await ctx.params;

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/credits`, {
      headers: backendHeaders(userId),
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
