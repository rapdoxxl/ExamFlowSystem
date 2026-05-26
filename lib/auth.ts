import { cookies } from "next/headers";
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

const COOKIE_NAME = "regsysol_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET || "regsysol-local-change-this-secret-before-production";
}

function useSecureCookie() {
  const value = process.env.AUTH_COOKIE_SECURE?.toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string) {
  return crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");
}

function createToken(payload: SessionPayload) {
  const encoded = base64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function parseToken(token?: string): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = sign(encoded);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.userId || !payload.role || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(userId: string, role: UserRole) {
  const cookieStore = await cookies();
  const token = createToken({ userId, role, exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    maxAge: MAX_AGE_SECONDS,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  return parseToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId }, include: { registration: true, class: true } });
}

export async function requireRole(roles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}

export function redirectIfNoRole(req: NextRequest, rolePaths: Partial<Record<UserRole, string>>) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = parseToken(token);
  const pathname = req.nextUrl.pathname;
  if (!session) return null;
  const target = rolePaths[session.role];
  if (target && !pathname.startsWith(target)) {
    return NextResponse.redirect(new URL(target, req.url));
  }
  return null;
}
