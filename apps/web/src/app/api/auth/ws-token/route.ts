import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { auth } from "@/lib/auth";

const encoder = new TextEncoder();
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }
  return encoder.encode(secret);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = await new SignJWT({
    sub: session.user.id,
    email: session.user.email,
    role: session.user.role,
    companyId: session.user.companyId,
    employeeId: session.user.employeeId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(getSecret());

  return NextResponse.json({ token });
}
