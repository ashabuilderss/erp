import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { decode } from "@auth/core/jwt";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000";

const encoder = new TextEncoder();
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  return encoder.encode(secret);
}

const SESSION_COOKIE = process.env.AUTH_SESSION_COOKIE || "authjs.session-token";

type SessionUserForApi = {
  id?: string;
  email?: string | null;
  role?: string;
  companyId?: string;
  employeeId?: string | null;
};

async function createApiToken(user: SessionUserForApi): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    role: user.role,
    companyId: user.companyId,
    employeeId: user.employeeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(getSecret());
}

async function getSessionFromCookie(request: NextRequest): Promise<SessionUserForApi | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith(`${SESSION_COOKIE}=`));
  if (!sessionCookie) return null;
  
  const token = sessionCookie.substring(SESSION_COOKIE.length + 1);
  if (!token) return null;
  
  try {
    const payload = await decode({
      token,
      secret: process.env.AUTH_SECRET!,
      salt: SESSION_COOKIE,
    });
    if (!payload) return null;
    return {
      id: String(payload.sub || payload.id || ""),
      email: String(payload.email || ""),
      role: String(payload.role || ""),
      companyId: String(payload.companyId || ""),
      employeeId: payload.employeeId ? String(payload.employeeId) : null,
    };
  } catch {
    return null;
  }
}

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const contentType = request.headers.get("content-type") || "application/json";
  const isFormData = contentType.includes("multipart/form-data");

  const headers: Record<string, string> = {};
  const existingAuth = request.headers.get("authorization");
  if (existingAuth) {
    headers["Authorization"] = existingAuth;
  } else {
    const user = await getSessionFromCookie(request);
    if (!user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const apiToken = await createApiToken(user);
    headers["Authorization"] = `Bearer ${apiToken}`;
  }
  if (!isFormData) headers["Content-Type"] = "application/json";

  const body = isFormData
    ? await request.formData()
    : request.method === "GET" || request.method === "DELETE"
      ? undefined
      : await request.text();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res: Response;
  try {
    const upstreamUrl = `${API_URL}/api/${pathStr}${request.nextUrl.search}`;
    res = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body: body as BodyInit | undefined,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    const msg =
      err instanceof Error && err.name === "AbortError"
        ? "Backend request timed out"
        : `Backend unreachable at ${API_URL}/api/${pathStr}`;
    return NextResponse.json({ message: msg }, { status: 502 });
  }
  clearTimeout(timeout);

  const ct = res.headers.get("content-type") || "";

  if (ct.includes("text/event-stream")) {
    return new Response(res.body, {
      status: res.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  const responseHeaders = new Headers();
  const forwardedHeaders = [
    "content-type",
    "content-disposition",
    "cache-control",
  ];
  for (const name of forwardedHeaders) {
    const value = res.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
