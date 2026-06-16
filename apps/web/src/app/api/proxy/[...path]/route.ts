import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/lib/auth";

const API_URL = process.env.API_URL || "http://127.0.0.1:4000";

const encoder = new TextEncoder();
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  return encoder.encode(secret);
}

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

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const apiToken = await createApiToken(session.user);

  const contentType = request.headers.get("content-type") || "application/json";
  const isFormData = contentType.includes("multipart/form-data");

  const headers: Record<string, string> = {};
  headers["Authorization"] = `Bearer ${apiToken}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const body = isFormData
    ? await request.formData()
    : request.method === "GET" || request.method === "DELETE"
      ? undefined
      : await request.text();

  const res = await fetch(`${API_URL}/api/${pathStr}`, {
    method: request.method,
    headers,
    body: body as BodyInit | undefined,
  });

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

  const data = ct.includes("application/json")
    ? await res.json()
    : await res.text();

  if (res.status === 401 && pathStr !== "auth/refresh") {
    return NextResponse.json(data, { status: 401 });
  }

  return NextResponse.json(data, { status: res.status });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
