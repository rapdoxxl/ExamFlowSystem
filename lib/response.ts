import { NextResponse } from "next/server";

export function jsonOk<T>(data: T) {
  return NextResponse.json({ ok: true, data });
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}
