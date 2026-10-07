import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

import { appNavigation } from "@/config/site";

function getRequiredPermission(pathname: string) {
  const match = appNavigation
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.permission ?? "dashboard.read";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/app")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/app") {
    return NextResponse.next();
  }

  const permissions = Array.isArray(token.permissions) ? token.permissions : [];
  const requiredPermission = getRequiredPermission(pathname);

  if (!permissions.includes(requiredPermission)) {
    const dashboardUrl = new URL("/app/dashboard", request.url);
    dashboardUrl.searchParams.set("denied", requiredPermission);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
