import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;
    const isLoginPage = pathname.includes("/login");
    const locale = pathname.split("/")[1] || routing.defaultLocale;

    if (!sessionCookie && !isLoginPage) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (sessionCookie && isLoginPage) {
        return NextResponse.redirect(
            new URL(`/${locale}/dashboard`, request.url),
        );
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
