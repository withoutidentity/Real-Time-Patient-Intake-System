import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { sessionIdSchema } from "../../../lib/schema";

export async function POST() {
  const sessionId = randomUUID().replace(/-/g, "").slice(0, 12);

  return NextResponse.json({ sessionId });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const parsed = sessionIdSchema.safeParse(sessionId);

  return NextResponse.json({
    valid: parsed.success
  });
}
