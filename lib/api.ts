import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getSession, isAdmin } from "@/lib/auth";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { isTrustedMutation } from "@/lib/request";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
export function checkedId(id: string) {
  if (!/^[a-f\d]{24}$/i.test(id))
    throw new HttpError(400, "Invalid record ID.");
  return id;
}
export async function authorize(request: NextRequest, admin = false) {
  if (!isTrustedMutation(request))
    throw new HttpError(403, "Invalid request origin.");
  if (!isDatabaseConfigured())
    throw new HttpError(503, "Database is not configured.");
  const user = await getSession();
  if (!user) throw new HttpError(401, "Please log in.");
  if (admin && !isAdmin(user.role))
    throw new HttpError(403, "Administrator access required.");
  await connectToDatabase();
  return user;
}
export function apiError(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { message: error.message },
      { status: error.status }
    );
  if (error instanceof ZodError)
    return NextResponse.json(
      { message: error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  if (error instanceof SyntaxError)
    return NextResponse.json({ message: "Invalid JSON." }, { status: 400 });
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === 11000
  )
    return NextResponse.json(
      { message: "This record already exists." },
      { status: 409 }
    );
  console.error(
    "API request failed:",
    error instanceof Error ? error.name : "Unknown error"
  );
  return NextResponse.json(
    { message: "Unable to complete this request. Please try again." },
    { status: 503 }
  );
}
