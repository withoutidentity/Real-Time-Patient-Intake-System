import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const staffToken = process.env.STAFF_ACCESS_TOKEN;

  if (!staffToken) {
    return NextResponse.next();
  }

  const cookieToken = request.cookies.get("staff_session")?.value;

  if (cookieToken === staffToken) {
    return NextResponse.next();
  }

  const queryToken = request.nextUrl.searchParams.get("token");

  if (queryToken === staffToken) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("token");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("staff_session", staffToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/dashboard"
    });

    return response;
  }

  return new NextResponse("Unauthorized", { status: 401 });
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
