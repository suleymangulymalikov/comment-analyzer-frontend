export function backendHeaders(userId?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const secret = process.env.INTERNAL_API_SECRET;
  if (secret) headers["Authorization"] = `Bearer ${secret}`;
  if (userId) headers["x-user-id"] = userId;
  return headers;
}
