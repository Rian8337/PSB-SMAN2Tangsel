import { getServerAuthApiClient } from "@/api/server";
import { Bookmarks } from "@/components/bookmarks/Bookmarks";
import { routing } from "@/i18n/routing";
import { UserRole } from "@psb/shared/types";
import { decodeSessionCode } from "@psb/shared/utils";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string; sessionCode: string }>;
}) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "Bookmarks",
    });

    return { title: t("title") };
}

export default async function BookmarksPage({
    params,
}: {
    params: Promise<{ sessionCode: string }>;
}) {
    const { sessionCode } = await params;
    const decoded = decodeSessionCode(sessionCode);

    if (!decoded) {
        notFound();
    }

    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.Administrator) {
        notFound();
    }

    return <Bookmarks session={decoded.session} semester={decoded.semester} />;
}
