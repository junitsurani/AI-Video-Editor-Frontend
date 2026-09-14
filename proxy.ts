import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Always overwrite the client-provided value before the server auth layout reads it.
  headers.set(
    "x-frame-path",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/studio/:path*"] };
