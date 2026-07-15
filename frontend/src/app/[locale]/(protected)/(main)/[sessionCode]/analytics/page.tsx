import { getServerAuthApiClient } from "@/api/server";
import { DownloadAnalytics } from "@/components/analytics/DownloadAnalytics";
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
        namespace: "Analytics",
    });

    return { title: t("title") };
}

export default async function AnalyticsPage({
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

    if (user?.role !== UserRole.Teacher) {
        notFound();
    }

    return (
        <DownloadAnalytics
            session={decoded.session}
            semester={decoded.semester}
        />
    );
}
