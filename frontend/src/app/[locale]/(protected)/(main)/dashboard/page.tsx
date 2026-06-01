import {
    getServerAuthApiClient,
    getServerSessionApiClient,
} from "@/api/server";
import { DashboardClientView } from "@/components/dashboard/DashboardClientView";
import { routing } from "@/i18n/routing";
import { encodeSessionCode } from "@/utils/sessionCode";
import { UserRole } from "@psb/shared/types";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { unauthorized } from "next/navigation";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    const t = await getTranslations({
        locale: hasLocale(routing.locales, locale)
            ? locale
            : routing.defaultLocale,
        namespace: "Dashboard",
    });

    return { title: t("title") };
}

export default async function DashboardPage() {
    const authApiClient = await getServerAuthApiClient();
    const user = await authApiClient.getMe();

    if (!user || user.role === UserRole.administrator) {
        unauthorized();
    }

    const sessionApiClient = await getServerSessionApiClient();
    const active = await sessionApiClient.getActive().catch(() => null);

    const activeCode = active
        ? encodeSessionCode(active.session, active.semester)
        : null;

    return (
        <DashboardClientView
            name={user.name.split(" ")[0]}
            role={user.role}
            activeSessionCode={activeCode}
        />
    );
}
