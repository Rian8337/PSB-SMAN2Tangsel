import { UserRole } from "@psb/shared/types";
import { sessionDataValidator } from "@psb/shared/validator";
import { hasLocale } from "next-intl";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function decodeBase64Url(str: string): Uint8Array {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");

    while (base64.length % 4 > 0) {
        base64 += "=";
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

async function decryptSession(token: string): Promise<string | null> {
    try {
        const keyHex = process.env.SESSION_ENCRYPTION_KEY;

        if (keyHex?.length !== 64) {
            console.error("SESSION_ENCRYPTION_KEY is missing or invalid.");

            return null;
        }

        const keyBytes = new Uint8Array(
            keyHex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? [],
        );

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBytes,
            { name: "AES-GCM" },
            false,
            ["decrypt"],
        );

        const raw = decodeBase64Url(token);

        const ivLength = 12;
        const authTagLength = 16;

        const iv = raw.slice(0, ivLength);
        const authTag = raw.slice(ivLength, ivLength + authTagLength);
        const ciphertext = raw.slice(ivLength + authTagLength);

        const dataToDecrypt = new Uint8Array(
            ciphertext.length + authTag.length,
        );

        dataToDecrypt.set(ciphertext, 0);
        dataToDecrypt.set(authTag, ciphertext.length);

        const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv, tagLength: 128 },
            cryptoKey,
            dataToDecrypt,
        );

        return new TextDecoder().decode(decryptedBuffer);
    } catch (e) {
        console.error("Failed to decrypt session token:", e);

        return null;
    }
}

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionCookie = request.cookies.get("session")?.value;

    const firstSegment = pathname.split("/")[1];

    const locale = hasLocale(routing.locales, firstSegment)
        ? firstSegment
        : routing.defaultLocale;

    const isPublicPage =
        pathname === "/" ||
        pathname === `/${locale}` ||
        pathname.includes("/login");

    if (!sessionCookie && !isPublicPage) {
        return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
    }

    if (sessionCookie) {
        let role: UserRole | null = null;

        const decodedCookie = decodeURIComponent(sessionCookie);

        // Express 'signed: true' cookies look like: "s:ENCRYPTED_PAYLOAD.SIGNATURE".
        // We are only interested in the ENCRYPTED_PAYLOAD part for decryption.
        const encryptedToken = decodedCookie.startsWith("s:")
            ? decodedCookie.slice(2).split(".")[0]
            : decodedCookie;

        const decryptedString = await decryptSession(encryptedToken);

        if (decryptedString) {
            try {
                const rawJson = JSON.parse(decryptedString) as {
                    data?: unknown;
                };

                if (typeof rawJson !== "object" || !rawJson.data) {
                    throw new Error("Invalid session data");
                }

                const data = sessionDataValidator.parse(rawJson.data);

                role = data.role;
            } catch {
                /* empty */
            }
        }

        // If the decryption failed or the cookie is invalid, clear it and force login.
        if (!role) {
            const response = NextResponse.redirect(
                new URL(`/${locale}/login`, request.url),
            );

            response.cookies.delete("session");
            return response;
        }

        const normalizedPath = pathname.replace(
            new RegExp(`^/(${routing.locales.join("|")})/?`),
            "/",
        );

        const isAdminRoute = normalizedPath.startsWith("/admin");

        // If the user is already logged in, redirect them to the appropriate dashboard.
        if (pathname.includes("/login")) {
            const targetPath =
                role === UserRole.administrator ? "/admin" : "/dashboard";

            return NextResponse.redirect(
                new URL(`/${locale}${targetPath}`, request.url),
            );
        }

        // Block access to admin routes for non-admin users, and redirect admin users away from main routes.
        if (role === UserRole.administrator && !isAdminRoute) {
            return NextResponse.redirect(
                new URL(`/${locale}/admin`, request.url),
            );
        }

        if (role !== UserRole.administrator && isAdminRoute) {
            return NextResponse.redirect(
                new URL(`/${locale}/dashboard`, request.url),
            );
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
