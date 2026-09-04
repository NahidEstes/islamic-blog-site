import { NextRequest, NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";
import { isTrustedMutation } from "@/lib/request";
export async function POST(request: NextRequest) {
  if (!isTrustedMutation(request))
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 }
    );
  await destroySession();
  // Relative redirect stays on the visitor's origin behind proxies and on
  // alternate local ports, without trusting a forwarded host header.
  return new NextResponse(null, { status: 303, headers: { Location: "/" } });
}
