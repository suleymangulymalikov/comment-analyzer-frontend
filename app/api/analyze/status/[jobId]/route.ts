import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { backendHeaders } from "@/lib/backend";

export async function GET(_req: Request, ctx: RouteContext<"/api/analyze/status/[jobId]">) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { jobId } = await ctx.params;

  const backendUrl = process.env.BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 500 });
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl}/analyze/status/${jobId}`, {
      headers: backendHeaders(session.user.id),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the analysis backend." },
      { status: 502 }
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.detail ?? data?.error ?? `Backend returned ${response.status}`;
    return NextResponse.json({ error: message }, { status: response.status });
  }

  return NextResponse.json(data);
}
